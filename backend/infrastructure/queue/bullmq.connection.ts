

// Не переиспользую основной Redis клиент - у BullMQ свои требования к соединению

import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

// BullMQ рекомендует maxRetriesPerRequest: null - иначе воркер падает при временной недоступности Redis
export const bullmqConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
  retryStrategy: (times: number) => {
    if (times > 20) {
      console.error('[BullMQ Redis] Превышено число попыток переподключения.');
      return null;
    }
    const delay = Math.min(100 * 2 ** times, 30_000);
    console.warn(`[BullMQ Redis] Переподключение через ${delay}ms (попытка ${times})...`);
    return delay;
  },
});

bullmqConnection.on('error', (err) => console.error('[BullMQ Redis] Ошибка:', err.message));
bullmqConnection.on('ready', () => console.log('[BullMQ Redis] Готов.'));