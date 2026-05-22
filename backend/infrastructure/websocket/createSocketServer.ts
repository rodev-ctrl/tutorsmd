/////////////////////////////////////////////////////////////////////
// io = весь WebSocket сервер. websocket-Layer. MANAGER FOR OBJECTS
// socket = конкретное соединение конкретного клиента. Connection/SESSION OBJECT
/////////////////////////////////////////////////////////////////////


import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import http from "http";
import { PrismaClient } from "../../generated/prisma";
import { IFileStorageFactory } from "../../application/ports/file/IFileStorageFactory";
import { IAccessTokenFactory }               from "../../application/ports/token/IAccessTokenFactory";
import { SendSupportChatMessageUseCase }     from "../../application/usecases/support-chat/SendSupportChatMessageUseCase";
// import { GetSupportChatHistoryUseCase }      from "../../application/usecases/chat/GetSupportChatHistoryUseCase";

import { socketAuthMiddleware }  from "../../presentation/websocket/middleware/socketAuth";
import { createSupportChatHandler } from "../../presentation/websocket/handlers/support-chat/supportChatHandler";
import { createLessonHandler }   from "../../presentation/websocket/handlers/lesson/LessonHandler";
import { createBoardHandler }    from "../../presentation/websocket/handlers/board/BoardHandler";
import { createWebRtcHandler }   from "../../presentation/websocket/handlers/web-rtc/WebRtcHandler";

import redis, { subClient } from "../redis/redisClient";
import { GetSupportChatHistoryUseCase } from "../../application/usecases/support-chat/GetSupportChatHistoryUsecase";
import { JoinSupportChatUseCase } from "../../application/usecases/support-chat/JoinSupportChatUseCase";
import { CompleteLessonUseCase } from "../../application/usecases/lesson/CompleteLessonUseCase";

// ── Конфиг из env ─────────────────────────────────────────────────────────────

const HANDSHAKE_LIMIT   = 20;
const HANDSHAKE_WINDOW  = 60; // секунды (Redis EXPIRE принимает секунды)

/**
 * Время жизни Access Token в мс.
 * Берётся из JWT_ACCESS_EXPIRES_IN (секунды). Fallback: 15 мин.
 * Должно совпадать с exp в JwtTokenService — иначе socket отключится раньше/позже.
 */
const TOKEN_LIFETIME_MS =
  parseInt(process.env.JWT_ACCESS_EXPIRES_IN ?? "900", 10) * 1_000;

/*
   в Production Cloudfare стнет хорошим proxy, но все равно поставлю заглушку для development (process.env.TRUST_PROXY === 'true')
 */
const TRUST_PROXY = process.env.NODE_ENV === 'production'
  && process.env.TRUST_PROXY === 'true';



const resolveIp = (
  req: http.IncomingMessage,
  socket: { remoteAddress?: string },
): string => {
  if (TRUST_PROXY) {
    const fwd = req.headers["x-forwarded-for"];

    // fwd[0] - РЕАЛЬНЫЙ IP клиента
    if (fwd) {
      return (Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim();   
    }
  }
  return socket.remoteAddress ?? "unknown";
};

/**
 * Redis-based rate limit для WS handshake (per IP).
 * INCR + EXPIRE — атомарно, работает в кластере.
 *
 * @returns true — лимит превышен, соединение нужно отклонить.
 */
const checkHandshakeLimit = async (ip: string): Promise<boolean> => {
  
  // 1) Ключ в Redis: "rl:ws:192.168.1.1"
  // Отдельный ключ для каждого IP. ip=IP
  const key = `rl:ws:${ip}`;

  try {
    // 2) Атомарно увеличивает счетчик на 1
    const count = await redis.incr(key);

    // 3) Только при ПЕРВОМ подключении ставим TTL (время жизни ключа)
    // При count = 1 окно фиксированное: N подключений за 60 секунд, потом сброс
    if (count === 1) await redis.expire(key, HANDSHAKE_WINDOW);

    // 4) true = лимит превышен -> отклонить подключение
    // false = всё ок -> пропустить
    return count > HANDSHAKE_LIMIT;
  } catch {
    // Redis недоступен → fail-open: разрешаем handshake.
    return false;
  }
};

// ── Типы ─────────────────────────────────────────────────────────────────────

interface SocketServerDeps {
  httpServer:         http.Server;
  prisma:             PrismaClient;
  fileStorage:            IFileStorageFactory;
  tokenService:       IAccessTokenFactory;
  joinSupportChat:    JoinSupportChatUseCase;
  sendSupportMessage: SendSupportChatMessageUseCase;
  getSupportChatHistory:  GetSupportChatHistoryUseCase;
  completeLessonUseCase:  CompleteLessonUseCase
}

// ── Фабрика ───────────────────────────────────────────────────────────────────

export const createSocketServer = ({
  httpServer,
  prisma,
  fileStorage,
  tokenService,
  joinSupportChat,
  sendSupportMessage,
  getSupportChatHistory,
  completeLessonUseCase
}: SocketServerDeps): SocketIOServer => {
  const allowedOrigins = (process.env.CLIENT_URL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin:      allowedOrigins,
      credentials: true,
      methods:     ["GET", "POST"],
    },
    pingTimeout:       20_000,
    pingInterval:      25_000,
    // Файлы идут через R2 presigned URL — через сокет только JSON.
    // 64 KB достаточно для любого JSON-события.
    maxHttpBufferSize: 64 * 1024,
    connectTimeout:    10_000,
    allowUpgrades:     true,
    transports:        ["polling", "websocket"],
  });

  // ── Redis Adapter ──────────────────────────────────────────────────────────
  // Синхронизирует io.to(room).emit() между процессами / pod'ами.
  // Без адаптера broadcast работает только внутри одного процесса.
  io.adapter(createAdapter(redis, subClient));

  // ── Rate limit на WS handshake (per IP, Redis) ─────────────────────────────
  // express-rate-limit не перехватывает HTTP Upgrade → делаем вручную.
  httpServer.on("upgrade", async (req, socket) => {
    const ip      = resolveIp(req, socket as any);
    const limited = await checkHandshakeLimit(ip);

    if (limited) {
      try {
        socket.write("HTTP/1.1 429 Too Many Requests\r\nContent-Length: 0\r\n\r\n");
        socket.destroy();
      } catch {
        // Сокет уже закрыт со стороны клиента.
      }
      return;
    }
  });

  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use(socketAuthMiddleware(tokenService));

  // ── Connection ────────────────────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    // Принудительное отключение по истечении Access Token.
    // Клиент должен переподключиться с новым токеном после refresh.
    const tokenTimer = setTimeout(() => {
      socket.emit("auth:expired");
      socket.disconnect(true);
    }, TOKEN_LIFETIME_MS);

    socket.once("disconnect", () => clearTimeout(tokenTimer));

    try {
      createSupportChatHandler(io, socket, joinSupportChat, sendSupportMessage, getSupportChatHistory, fileStorage);
      createLessonHandler(io, socket, { completeLessonUseCase, fileStorage, prisma});
    
      createBoardHandler(io, socket);
      createWebRtcHandler(io, socket);
    } catch (err) {
      console.error("[socket] Ошибка при регистрации handlers:", {
        socketId: socket.id,
        err,
      });
      socket.disconnect(true);
    }
  });

  return io;
};