import { Server, Socket }            from "socket.io";
import { safeHandler }               from "../../utils/safeHandler";
import { isRateLimited }             from "../../utils/socketRateLimit";
import { JoinSupportChatUseCase }    from "../../../../application/usecases/support-chat/JoinSupportChatUseCase";
import { SendSupportChatMessageUseCase } from "../../../../application/usecases/support-chat/SendSupportChatMessageUseCase";
import { SupportMessageDto }         from "../../../../application/ports/support-chat/ISupportChatFactory";
import { IFileStorageFactory }        from "../../../../application/ports/file/IFileStorageFactory";
import sanitize from "sanitize-filename";
import { AdminJoinSchema, HistoryMoreSchema, JoinSchema, MessageSchema, PresignSchema, TypingSchema } from "./validate/support-chat.schema";
import { ALLOWED_MIME_TYPES, PRESIGN_TTL_SECONDS, SIZE_LIMITS } from "../../../../domain/entities/file/fileConstants";
import { FileMetadataDto } from "../../../../application/ports/file/FileMetadataDto";
import { GetSupportChatHistoryUseCase } from "../../../../application/usecases/support-chat/GetSupportChatHistoryUseCase";


interface SocketUser {
  id: string;
  activeRole: string;
}


export const createSupportChatHandler = (
  io:                 Server,
  socket:             Socket,
  joinChatUseCase:    JoinSupportChatUseCase,
  sendMessageUseCase: SendSupportChatMessageUseCase,
  getHistoryUseCase:  GetSupportChatHistoryUseCase,
  fileStorage:        IFileStorageFactory,
): void => {
  const user = socket.data.user as SocketUser | undefined;
  if (!user) {
    socket.disconnect();
    return;
  }

  const { id: userId, activeRole } = user;

  // ── support:join ──────────────────────────────────────────────────────────
  // Юзер открыл виджет → findOrCreate чат в БД → получает реальный chatId + историю.
  // Admin передаёт targetUserId чтобы открыть чужой чат.
  socket.on(
    "support:join",
    safeHandler("support:join", async (
      payload: { targetUserId?: string } | null,
      callback?: Function,
    ) => {
      const parsed = JoinSchema.safeParse(payload);
      if (!parsed.success) {
        return callback?.({ ok: false, error: parsed.error.issues[0].message });
      }
      
      const resolvedUserId =
        activeRole === "admin" && parsed.data?.targetUserId
          ? parsed.data.targetUserId
          : userId;

      const { chat, messages } = await joinChatUseCase.execute({
        userId: resolvedUserId,
      });

      // Реальный chatId из БД — не 'support:${userId}'
      const roomId = `support:${chat.id}`;
      socket.data.chatId = chat.id;

      await socket.join(roomId);

      // Admin дополнительно в общей комнате агентов
      if (activeRole === "admin") {
        await socket.join("support:agents");
      }

      socket.emit("support:history", messages);
      callback?.({ ok: true, chatId: chat.id });
    }),
  );

  // ── support:admin_join ────────────────────────────────────────────────────
  // Admin переключается между чатами пользователей.
  socket.on(
    "support:admin_join",
    safeHandler("support:admin_join", async (
      data: { targetUserId: string },
      callback?: Function,
    ) => {
      if (activeRole !== "admin") {
        return callback?.({ ok: false, error: "Forbidden" });
      }

       const parsed = AdminJoinSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ ok: false, error: parsed.error.issues[0].message });
      }

      // Уходим из предыдущего чата
      if (socket.data.chatId) {
        await socket.leave(`support:${socket.data.chatId}`);
      }

      const { chat, messages } = await joinChatUseCase.execute({
        userId: parsed.data.targetUserId,
      });

      socket.data.chatId = chat.id;
      await socket.join(`support:${chat.id}`);

      socket.emit("support:history", messages);
      callback?.({ ok: true, chatId: chat.id });
    }),
  );

  // ── support:message ───────────────────────────────────────────────────────
  // Текстовое сообщение + опционально metadata уже загруженных файлов.
  // Сами файлы уже в R2 — клиент загрузил через presigned URL.
  socket.on(
    "support:message",
    safeHandler("support:message", async (
      data: { text?: string; files?: FileMetadataDto[] },
      callback?: Function,
    ) => {

       console.log("[SOCKET] support:message", {
      userId,
      role: activeRole,
      chatId: socket.data.chatId,
      data,
    });

      // Rate limit: 30 сообщений / минуту
      if (await isRateLimited(socket, 30, "support:message", 60_000)) {
        return callback?.({ ok: false, error: "Too many messages" });
      }

      const chatId = socket.data.chatId as string | undefined;
      if (!chatId) {
        console.error("[SOCKET] NO CHAT ID");
        return callback?.({ ok: false, error: "Join chat first" });
      }

       const parsed = MessageSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ ok: false, error: parsed.error.issues[0].message });
      }

      const { message } = await sendMessageUseCase.execute({
        chatId,
        senderId:    userId,
        senderRole:  activeRole,
        text:        parsed.data.text,
        // Файлы уже в R2 — передаём только metadata
        attachments: parsed.data.files?.map((f) => ({
          key:      f.key,
          name:     f.name,
          mimeType: f.mimeType,
          size:     f.size
        })),
      });

      // Broadcast всем в комнате чата
      io.to(`support:${chatId}`).emit("support:message", message);

      // Уведомление агентам которые не в этом чате
      if (activeRole !== "admin") {
        socket.to("support:agents").emit("support:notify", {
          chatId,
          senderId: userId,
          preview:  data.text?.slice(0, 100) ?? "[file]",
        });
      }

      callback?.({ ok: true, messageId: message.id });
    }),
  );

  // -- support:presign ---------------------------------------------------------
  // Flow 3 из конспекта:
  // 1. Client emit 'support:presign' {fileName, mimeType, size}
  // 2. Сервер создаёт presigned PUT URL в R2
  // 3. emit обратно {uploadUrl, key}
  // 4. Client загружает файл напрямую в R2 через HTTP PUT
  // 5. Client emit 'support:message' с files: [{key, name, size, mimeType}]
  socket.on(
    "support:presign",
    safeHandler("support:presign", async (
      data: { fileName: string; mimeType: string; size: number },
      callback?: Function,
    ) => {
      // Rate limit: 10 файлов / минуту
      if (await isRateLimited(socket, 10, "support:presign", 60_000)) {
        return callback?.({ ok: false, error: "Too many file requests" });
      }

      const chatId = socket.data.chatId as string | undefined;
      if (!chatId) {
        return callback?.({ ok: false, error: "Join chat first" });
      }

       const parsed = PresignSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ ok: false, error: parsed.error.issues[0].message });
      }
      
      const { fileName, mimeType, size } = parsed.data;

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
  return callback?.({ ok: false, error: `File type "${mimeType}" is not allowed` });
}
 
       if (size > SIZE_LIMITS["support/chats"]) {
        return callback?.({
          ok: false,
          error: `File too large. Max ${SIZE_LIMITS["support/chats"] / 1024 / 1024} MB`,
        });
      }


      const cleanName = sanitize(fileName || "file");
      const key = fileStorage.buildKey("support/chats", userId, fileName);
      const uploadUrl = await fileStorage.getPresignedUploadUrl(key, mimeType, PRESIGN_TTL_SECONDS);
 
      callback?.({ ok: true, uploadUrl, key, name: cleanName });
    }),
  );

  // ── support:typing ────────────────────────────────────────────────────────
  // Fire-and-forget — не сохраняем в БД.
  socket.on(
    "support:typing",
    safeHandler("support:typing", async (data: { isTyping: boolean }) => {
      const chatId = socket.data.chatId as string | undefined;
      if (!chatId) return;

      const parsed = TypingSchema.safeParse(data);
      if (!parsed.success) return;

      socket.to(`support:${chatId}`).emit("support:typing", {
        userId,
        role:     activeRole,
        isTyping: parsed.data.isTyping ?? false,
      });
    }),
  );


  socket.on(
  "support:history_more",
  safeHandler("support:history_more", async (
    data: unknown,
    callback?: Function,
  ) => {
    const parsed = HistoryMoreSchema.safeParse(data);
    if (!parsed.success) {
      return callback?.({ ok: false, error: parsed.error.issues[0].message });
    }

    const { messages, hasMore } = await getHistoryUseCase.execute({
      chatId:        parsed.data.chatId,
      requesterId:   userId,
      requesterRole: activeRole,
      limit:         parsed.data.limit,
      before:        new Date(parsed.data.before),
    });

    callback?.({ ok: true, messages, hasMore });
  }),
);

};