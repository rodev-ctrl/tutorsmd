// presentation/websocket/handlers/lessonHandler.ts
//
// Ответственность:
//   lesson:join       — авторизация в комнате, Redis presence
//   lesson:chat:join   — подписка на отдельную чат-комнату + история из Postgres
//   lesson:message    — сохранение сообщения в Postgres, broadcast
//   lesson:leave      — явный выход, очистка presence
//   lesson:end        — тьютор/админ завершает урок, опционально обновляет статус в БД
//   disconnect       — автоматическое удаление из presence
//
// Файлы в чате урока передаются НЕ через сокет.
// Клиент сначала POST /api/lessons/:id/files → получает presigned URL → грузит в R2
// → шлёт lessonMessage с fileKey. Сервер хранит только R2-ключ в LessonMessage.

import type { Server, Socket } from "socket.io";
import { PrismaClient } from '@prisma/client';
import { safeHandler }         from "../../utils/safeHandler";
import { isRateLimited }       from "../../utils/socketRateLimit";
import {
  presenceAdd,
  presenceRemove,
  presenceClear,
} from "../../utils/redisPresence";
import { clearBoardFromRedis } from "../board/BoardHandler";
import { ALLOWED_MIME_TYPES, PRESIGN_TTL_SECONDS, SIZE_LIMITS } from "../../../../domain/entities/file/fileConstants";
import sanitize                   from "sanitize-filename";
import { JoinLessonSchema, LessonContext, LessonHandlerDeps, LessonMessageSchema, PresignSchema } from "./validate/lesson.schema";
import { DomainError } from "../../../../domain/errors/DomainError";
import { NotFoundError } from "../../../../domain/errors/NotFoundError";
import { ConflictError } from "../../../../domain/errors/ConflictError";
import { UnauthorizedError } from "../../../../domain/errors/UnauthorizedError";
import { getRateLimitConfig } from "../../utils/getRateLimitConfig";


// ── Resolve lesson context ────────────────────────────────────────────────────

const resolveLessonContext = async (
  prisma:   PrismaClient,
  lessonId: string,
): Promise<LessonContext | null> => {
  const lesson = await prisma.lesson.findUnique({
    where:  { id: lessonId },
    select: {
      id:          true,
      scheduledAt: true,
      status:      true,
      client: { select: { id: true, userId: true } },
      tutor:  { select: { id: true, userId: true } },
    },
  });

  if (!lesson) return null;

  return {
    lessonId: lesson.id,
    clientId: lesson.client.id,
    tutorId:  lesson.tutor.id,
    clientUserId: lesson.client.userId,
    tutorUserId: lesson.tutor.userId,
    startAt:  lesson.scheduledAt,
    status:   lesson.status,
  };
};

// ── Handler factory ───────────────────────────────────────────────────────────

export const createLessonHandler = (
  io:     Server,
  socket: Socket,
  deps: LessonHandlerDeps
): void => {
  const { completeLessonUseCase, fileStorage, prisma } = deps;
  const user = socket.data.user as { id: string; activeRole: string } | undefined;
  if (!user) return;

  // -- joinLesson -------------------------------------------------------------------------
  //
  // Клиент: socket.emit("joinLesson", { lessonId })
  // Сервер: проверяет права (clientId | tutorId | admin), кладёт в Socket.IO room,
  //         добавляет в Redis presence, рассылает updateParticipants.
  //
  socket.on(
    "joinLesson",
    safeHandler("lesson:join", async (data: { lessonId: string }) => {
      // Идемпотентность: уже в уроке -> повторно шлём joinedLesson
      const existing = socket.data.lessonCtx as LessonContext | undefined;
      if (existing) {
        socket.emit("lesson:joined", {
          startAt: existing.startAt,
          status:  existing.status,
        });
        return;
      }

      const parsed = JoinLessonSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("lesson:join:error", { code: "BAD_REQUEST", message: parsed.error.issues[0].message });
        return;
      }

      const ctx = await resolveLessonContext(prisma, parsed.data.lessonId);
      if (!ctx) {
        socket.emit("lesson:join:error", { code: "NOT_FOUND", message: "Lesson not found" });
        return;
      }


       

        const allowed =
        (user.activeRole === "admin") ||
        (user.activeRole === "client" && ctx.clientUserId === user.id) ||
        (user.activeRole === "tutor"  && ctx.tutorUserId  === user.id);


      if (!allowed) {
        socket.emit("lesson:join:error", { code: "FORBIDDEN", message: "Access denied" });
        return;
      }

    

      const activeStatuses = ["pending", "confirmed", "in_progress"];
      if (!activeStatuses.includes(ctx.status)) {
        socket.emit("lesson:error", { code: "LESSON_NOT_ACTIVE", status: ctx.status });
        return;
      }

      const { limit, windowMs } = getRateLimitConfig(user.activeRole, "lesson:join");

      if (await isRateLimited(socket, limit, "lesson:join", windowMs)) {
        socket.emit("lesson:join:error", { error: "Too many requests" });
        return;
      }

      // Кешируем контекст на время соединения — не ходим в БД повторно
      socket.data.lessonCtx = ctx;
      socket.data.lessonId  = ctx.lessonId;

      await socket.join(ctx.lessonId);

      const participants = await presenceAdd(ctx.lessonId, socket.id);
      io.to(ctx.lessonId).emit("updateParticipants", participants);

      if (user.activeRole === "tutor") {
        io.to(ctx.lessonId).emit("tutor:joined", true);
      }

      socket.emit("lesson:join", {
        startAt: ctx.startAt,
        status:  ctx.status,
      });
    }),
  );

  // ── joinLessonChat ─────────────────────────────────────────────────────────
  //
  // Отдельная Socket.IO room "lesson-chat:{lessonId}" — чтобы не смешивать
  // сигнальные события урока (WebRTC, presence) с сообщениями чата.
  //
  // Клиент: socket.emit("joinLessonChat", { lessonId })
  // Сервер: шлёт lessonChatHistory (последние 50 из Postgres)
  //
  socket.on(
    "lesson:chat:join",
    safeHandler("lesson:chat:join", async (data: { lessonId: string }, callback) => {
      const parsed = JoinLessonSchema.safeParse(data);
      if (!parsed.success) return;

      const ctx = socket.data.lessonCtx as LessonContext | undefined;
      if (!ctx || ctx.lessonId !== parsed.data.lessonId) {
        socket.emit("lesson:chat:join:error", { code: "NOT_IN_LESSON" });
        return;
      }

      const { limit, windowMs } = getRateLimitConfig(user.activeRole, "lesson:chat:join");

      if (await isRateLimited(socket, limit, "lesson:chat:join", windowMs)) {
        socket.emit("lesson:chat:join:error", { error: "Too many requests" });
        return;
      }
 
      const chatRoom = `lesson-chat:${ctx.lessonId}`;
      if (socket.rooms.has(chatRoom)) return;

      await socket.join(chatRoom);


      const history = await prisma.lessonMessage.findMany({
        where:   { lessonId: ctx.lessonId },
        orderBy: { createdAt: "asc" },
        take:    50,
        select: {
          id:         true,
          senderId:   true,
          senderRole: true,
          text:       true,
          fileKey:    true, // R2 object key; клиент строит URL сам через CDN
          createdAt:  true,
        },
      });

      socket.emit("lesson:chat:history", history);
      socket.emit("lesson:chat:joined", { success: true });

      io.to(chatRoom).emit("lesson:chat:joined:user", {
        userId: user.id,
        role:   user.activeRole,
      });
    }),
  );

  // ── lessonMessage ──────────────────────────────────────────────────────────
  //
  // Клиент: socket.emit("lessonMessage", { lessonId, text, fileKey? })
  //   fileKey — опционально, R2 object key файла, уже загруженного клиентом.
  //   Файл в байтах через сокет НЕ передаётся.
  //
  socket.on(
    "lesson:message",
    safeHandler("lesson:message", async (data: {
      lessonId: string;
      text:     string;
      fileKey?: string;
    }) => {
      // 60 сообщений / 60 секунд
      if (await isRateLimited(socket, 60, "lesson:message", 60_000)) return;

      const parsed = LessonMessageSchema.safeParse(data);
      if (!parsed.success) return;
      
      const ctx = socket.data.lessonCtx as LessonContext | undefined;
       if (!ctx || ctx.lessonId !== parsed.data.lessonId) return;
      if (!["confirmed", "in_progress"].includes(ctx.status)) return;

      
      const { limit, windowMs } = getRateLimitConfig(user.activeRole, "lesson:message");

      if (await isRateLimited(socket, limit, "lesson:message", windowMs)) {
        return;
      }


      const message = await prisma.lessonMessage.create({
        data: {
          lessonId: ctx.lessonId,
          senderId:   user.id,
          senderRole: user.activeRole,
          text:       parsed.data.text?.trim()   || null,
          fileKey:    parsed.data.fileKey || null,
        },
        select: {
          id:         true,
          senderId:   true,
          senderRole: true,
          text:       true,
          fileKey:    true,
          createdAt:  true,
        },
      });

      io.to(`lesson-chat:${ctx.lessonId}`).emit("lesson:message:new", message);
    }),
  );




   // ── lesson:presign ─────────────────────────────────────────────────────────
  // Flow: клиент запрашивает presigned URL → грузит файл в R2 напрямую
  //       → шлёт lessonMessage с fileKey
 
  socket.on(
    "lesson:presign",
    safeHandler("lesson:presign", async (data: unknown, callback?: Function) => {
      if (await isRateLimited(socket, 10, "lesson:presign", 60_000)) {
        return callback?.({ ok: false, error: "Too many file requests" });
      }
 
      const ctx = socket.data.lessonCtx as LessonContext | undefined;
      if (!ctx) {
        return callback?.({ ok: false, error: "Join lesson first" });
      }
 
      const parsed = PresignSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ ok: false, error: parsed.error.issues[0].message });
      }
 
      const { fileName, mimeType, size, lessonId } = parsed.data;
 
      if (ctx.lessonId !== lessonId) {
        return callback?.({ ok: false, error: "Lesson mismatch" });
      }
 
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return callback?.({ ok: false, error: `File type "${mimeType}" is not allowed` });
      }
 
      if (size > SIZE_LIMITS["lessons"]) {
        return callback?.({
          ok: false,
          error: `File too large. Max ${SIZE_LIMITS["lessons"] / 1024 / 1024} MB`,
        });
      }
 
      const cleanName = sanitize(fileName || "file");
      const key       = fileStorage.buildKey("lessons", user.id, cleanName);
      const uploadUrl = await fileStorage.getPresignedUploadUrl(key, mimeType, PRESIGN_TTL_SECONDS);
 
      callback?.({ ok: true, uploadUrl, key, name: cleanName });
    }),
  );

  

  // ── leaveLesson ────────────────────────────────────────────────────────────
  //
  // Явный выход (кнопка «Покинуть»).
  // disconnect обрабатывает внезапный разрыв соединения.
  //
  socket.on(
    "lesson:leave",
    safeHandler("lesson:leave", async (data: { lessonId: string }) => {
       const parsed = JoinLessonSchema.safeParse(data);
      if (!parsed.success) return;

      const { lessonId } = parsed.data;

      await socket.leave(lessonId);
      await socket.leave(`lesson-chat:${lessonId}`);

      const participants = await presenceRemove(lessonId, socket.id);
      io.to(lessonId).emit("updateParticipants", participants);

      // Сброс контекста — disconnect не будет дублировать событие
      delete socket.data.lessonCtx;
      delete socket.data.lessonId;
    }),
  );

  // ── endLesson ──────────────────────────────────────────────────────────────
  //
  // Только тьютор или админ.
  // Очищаем Redis presence и шлём meetingEnded всем в комнате.
  // Клиенты после получения meetingEnded сами закрывают соединение.
  //
  socket.on(
    "endLesson",
    safeHandler("lesson:end", async (data: { lessonId: string }) => {
      if (user.activeRole !== "tutor" && user.activeRole !== "admin") return;

       const parsed = JoinLessonSchema.safeParse(data);
      if (!parsed.success) return;

      // Дополнительная проверка: только участник урока может его завершить
      const ctx = socket.data.lessonCtx as LessonContext | undefined;
      if (!ctx || ctx.lessonId !== parsed.data.lessonId) return;

     
       // CompleteLessonUseCase проверяет статус, чтобы только "IN_PROGRESS" можно было завершить: IN_PROGRESS -> COMPLETED
      try {
        await completeLessonUseCase.execute({
          lessonId: ctx.lessonId,
          tutorId:  ctx.tutorId,
        });
      } catch (err) {
        
        if (err instanceof DomainError || err instanceof NotFoundError || err instanceof ConflictError || err instanceof UnauthorizedError) {
          socket.emit("lesson:error", { code: "END_LESSON_FAILED", reason: err.message });
          return;
        }
        throw err; // неожиданная ошибка — пусть safeHandler логирует
      }

      await presenceClear(ctx.lessonId);

     

      await clearBoardFromRedis(ctx.lessonId).catch((err: Error) =>
        console.error("[endLesson] board redis cleanup failed:", err)
      );

      io.to(ctx.lessonId).emit("meetingEnded");
    }),
  );

  // ── disconnect ─────────────────────────────────────────────────────────────
  //
  // Срабатывает при любом разрыве (закрытие вкладки, сеть упала и т.д.).
  // lessonCtx уже сброшен при явном leaveLesson — не дублируем.
  //
  socket.on("disconnect", () => {
    const lessonId = socket.data?.lessonId as string | undefined;
    if (!lessonId) return;

    presenceRemove(lessonId, socket.id)
      .then((participants) => {
        io.to(lessonId).emit("updateParticipants", participants);
      })
      .catch((err: unknown) =>
        console.error("[disconnect] presenceRemove failed:", err)
      );
  });
};