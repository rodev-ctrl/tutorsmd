import { createClient, RedisClientType } from "redis";

// ── Фабрика клиента ───────────────────────────────────────────────────────────

const createRedisClient = (): RedisClientType => {
  const client = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",

    socket: {
      // TCP keepalive — обнаруживает "мёртвые" соединения быстрее чем таймаут ОС.
      keepAlive: 10_000,

      // Reconnect-стратегия: экспоненциальный backoff, максимум 30 сек.
      reconnectStrategy: (retries: number) => {
        if (retries > 20) {
          console.error("[Redis] Превышено число попыток переподключения.");
          return new Error("Redis: слишком много попыток");
        }
        const delay = Math.min(100 * 2 ** retries, 30_000);
        console.warn(`[Redis] Переподключение через ${delay}ms (попытка ${retries})...`);
        return delay;
      },
    },
  }) as RedisClientType;

  client.on("error",        (err) => console.error("[Redis] Ошибка:", err.message));
  client.on("reconnecting", ()    => console.warn("[Redis] Переподключение..."));
  client.on("ready",        ()    => console.log("[Redis] Готов."));

  return client;
};

// ── Два клиента ───────────────────────────────────────────────────────────────
//
// Socket.IO Redis Adapter требует отдельный pub и sub клиент.
// Клиент в режиме SUBSCRIBE блокируется и не может выполнять обычные команды.
//
// Также: все rate limit'ы и кэш используют `redis` (pubClient).
// `subClient` используется только адаптером.

const redis    = createRedisClient(); // основной: GET/SET/INCR/EXPIRE + pub
const subClient = createRedisClient(); // только для subscribe (Socket.IO adapter)

// ── Подключение ───────────────────────────────────────────────────────────────

/**
 * Подключает оба клиента и выполняет PING для проверки доступности.
 * Вызывать при старте приложения, до createSocketServer().
 */
export const connectRedis = async (): Promise<void> => {
  await Promise.all([redis.connect(), subClient.connect()]);

  // Health check — убеждаемся что Redis реально отвечает.
  const pong = await redis.ping();
  if (pong !== "PONG") throw new Error("[Redis] Health check провалился.");

  console.log("[Redis] Оба клиента подключены.");
};

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
  console.log(`[Redis] ${signal} — закрываем соединения...`);
  await Promise.allSettled([redis.quit(), subClient.quit()]);
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT",  () => shutdown("SIGINT"));

// ── Экспорты ──────────────────────────────────────────────────────────────────

export { subClient };
export default redis;