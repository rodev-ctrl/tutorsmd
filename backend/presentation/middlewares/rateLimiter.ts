/*
 2 типа лимитеров:
 - createPublicLimiter  — ключ по IP  (публичные роуты без requireAuth)
 - createUserLimiter    — ключ по userId из JWT (requireAuth роуты)
*/

import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request } from 'express';
import redis from '../../infrastructure/redis/redisClient';



type LimiterOpts = Pick<Options, 'windowMs' | 'max' | 'message' | 'skipSuccessfulRequests'> & {
  // Уникальный префикс ключа в Redis. Обязателен, чтобы разные лимитеры не конфликтовали
  prefix: string;
};



/*
  Публичные роуты (без авторизации).
  Ключ = IP-адрес.
 */
const createPublicLimiter = (opts: LimiterOpts): RateLimitRequestHandler =>
  rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    message: opts.message,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: Request) => `ip:${req.ip ?? 'unknown'}`,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix: opts.prefix,     // Итоговый ключ "rl:login:ip:1.2.3.4"
    }),
  });

/**
 * Авторизованные роуты (после requireAuth).
 * Ключ = userId из req.user.
 * Fallback на IP, если по какой-то причине userId ещё нет в req.
 */
const createUserLimiter = (opts: LimiterOpts): RateLimitRequestHandler =>
  rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    message: opts.message,
    skipSuccessfulRequests: opts.skipSuccessfulRequests ?? false,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.userId;
      return userId
        ? `${opts.prefix}:user:${userId}`
        : `${opts.prefix}:ip:${req.ip ?? 'unknown'}`;
    },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix: opts.prefix,
    }),
  });

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL API LIMITER
// Последняя линия защиты. Подключается в app.ts на все роуты (/api/*).
// Средние образовательные платформы: ~300 req/min на пользователя — норма
// для активной сессии (polling, prefetch, навигация).
// ─────────────────────────────────────────────────────────────────────────────

export const apiLimiter = createPublicLimiter({
  prefix: 'rl:api',
  windowMs: 60_000,           // 1 минута
  max: 300,
  skipSuccessfulRequests: false,
  message: { error: 'Too many requests, please slow down' },
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/register/*
 * Регистрация — дорогая операция (Argon2id). 10/час с одного IP — более чем.
 * Платформы типа Preply держат 5–10 регистраций с IP/час.
 */
export const registerLimiter = createPublicLimiter({
  prefix: 'rl:register',
  windowMs: 60 * 60_000,      // 1 час
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many registration attempts, try later' },
});

/**
 * POST /auth/login
 * Brute-force защита. 20 попыток за 15 минут — разумно для реального юзера
 * (опечатки, смена устройства). skipSuccessfulRequests=true: успешный логин
 * не тратит квоту.
 */
export const loginLimiter = createPublicLimiter({
  prefix: 'rl:login',
  windowMs: 15 * 60_000,      // 15 минут
  max: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, try again later' },
});

/**
 * POST /auth/logout
 * Авторизованный. Пользователь нажимает «выйти» — не чаще 10 раз в минуту.
 */
export const logoutLimiter = createUserLimiter({
  prefix: 'rl:logout',
  windowMs: 60_000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many logout attempts' },
});

/**
 * POST /auth/refresh
 * Silent refresh в SPA: браузер делает refresh при каждом открытии вкладки
 * и по таймеру. 30/мин с пользователя — достаточно даже при множестве вкладок.
 */
export const refreshLimiter = createUserLimiter({
  prefix: 'rl:refresh',
  windowMs: 60_000,
  max: 30,
  skipSuccessfulRequests: false,
  message: { error: 'Too many token refresh attempts' },
});

/**
 * POST /auth/resend-verification
 * Письмо уходит через SMTP. 5 писем за 10 минут — достаточно.
 */
export const resendVerificationLimiter = createPublicLimiter({
  prefix: 'rl:resend-verification',
  windowMs: 10 * 60_000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many verification email requests' },
});

/**
 * POST /auth/forgot-password
 * Публичный. 5 запросов за час с IP — стандарт для edu-платформ.
 */
export const forgotPasswordLimiter = createPublicLimiter({
  prefix: 'rl:forgot-password',
  windowMs: 60 * 60_000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many password reset requests, try later' },
});

/**
 * PUT /auth/change-password
 * Авторизованный. 5 смен пароля за час — с запасом.
 */
export const passwordChangeLimiter = createUserLimiter({
  prefix: 'rl:change-password',
  windowMs: 60 * 60_000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many password change attempts' },
});

/**
 * POST /auth/email/change
 * Авторизованный. Редкое действие. 3 запроса за час.
 */
export const emailChangeLimiter = createUserLimiter({
  prefix: 'rl:email-change',
  windowMs: 60 * 60_000,
  max: 3,
  skipSuccessfulRequests: true,
  message: { error: 'Too many email change requests' },
});

/**
 * DELETE /auth/sessions[/:tokenHash]
 * Авторизованный. Управление сессиями — не частая операция.
 */
export const revokeSessionLimiter = createUserLimiter({
  prefix: 'rl:revoke-session',
  windowMs: 5 * 60_000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many session revoke attempts' },
});

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Создание, подтверждение, отмена, перенос урока.
 * Авторизованный. Активный тьютор/клиент не делает >30 таких действий в минуту.
 */
export const lessonActionLimiter = createUserLimiter({
  prefix: 'rl:lesson-action',
  windowMs: 60_000,
  max: 30,
  skipSuccessfulRequests: false,
  message: { error: 'Too many lesson actions' },
});

/**
 * POST /lessons/:id/start
 * Старт урока — разовое действие. 5/мин с запасом на баги клиента.
 */
export const lessonStartLimiter = createUserLimiter({
  prefix: 'rl:lesson-start',
  windowMs: 60_000,
  max: 5,
  skipSuccessfulRequests: false,
  message: { error: 'Too many lesson start attempts' },
});

/**
 * POST/GET/DELETE /lessons/:id/materials
 * Загрузка файлов. 20/мин — достаточно для пакетной загрузки материалов.
 */
export const lessonMaterialLimiter = createUserLimiter({
  prefix: 'rl:lesson-material',
  windowMs: 60_000,
  max: 20,
  skipSuccessfulRequests: false,
  message: { error: 'Too many material upload/delete requests' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT CHAT (HTTP)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /support-chat/join
 * Авторизованный. Один join per session — лимит мягкий.
 */
export const supportChatJoinLimiter = createUserLimiter({
  prefix: 'rl:support-chat-join',
  windowMs: 60_000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many support chat join attempts' },
});

/**
 * GET /support-chat/:chatId/history
 * Polling истории. 60 запросов в минуту с пользователя — комфортно.
 */
export const supportChatHistoryLimiter = createUserLimiter({
  prefix: 'rl:support-chat-history',
  windowMs: 60_000,
  max: 60,
  skipSuccessfulRequests: false,
  message: { error: 'Too many chat history requests' },
});

/**
 * POST /support-chat/:chatId/messages
 * HTTP-fallback для отправки сообщений. 30 сообщений за 10 сек — реальный
 * потолок живого набора (с учётом мобильных клиентов).
 */
export const supportChatLimiter = createUserLimiter({
  prefix: 'rl:support-chat-msg',
  windowMs: 10_000,
  max: 30,
  skipSuccessfulRequests: false,
  message: { error: 'Too many support messages' },
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /reviews
 * Клиент оставляет отзыв после урока. 10 отзывов в час — с запасом на edge-cases.
 */
export const reviewSubmitLimiter = createUserLimiter({
  prefix: 'rl:review-submit',
  windowMs: 60 * 60_000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Too many review submissions' },
});

/**
 * GET /reviews/tutors/:tutorId/reviews
 * Публичный. 120 запросов в минуту с IP — учитывает парсеры и виджеты.
 */
export const tutorReviewsLimiter = createPublicLimiter({
  prefix: 'rl:tutor-reviews',
  windowMs: 60_000,
  max: 120,
  skipSuccessfulRequests: false,
  message: { error: 'Too many requests' },
});

// ─────────────────────────────────────────────────────────────────────────────
// APPEALS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /appeals
 * Авторизованный. Апелляция — редкое событие. 5 в час.
 */
export const appealCreateLimiter = createUserLimiter({
  prefix: 'rl:appeal-create',
  windowMs: 60 * 60_000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many appeal submissions' },
});

/**
 * POST /appeals/:id/resolve|reject
 * Admin. 50 действий в минуту — достаточно для ручной модерации.
 */
export const appealAdminLimiter = createUserLimiter({
  prefix: 'rl:appeal-admin',
  windowMs: 60_000,
  max: 50,
  skipSuccessfulRequests: false,
  message: { error: 'Too many admin appeal actions' },
});

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /feedback
 * Авторизованный. Обратная связь с платформой. 10 в час.
 */
export const feedbackLimiter = createUserLimiter({
  prefix: 'rl:feedback',
  windowMs: 60 * 60_000,
  max: 10,
  skipSuccessfulRequests: false,
  message: { error: 'Too many feedback submissions' },
});

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR (приватный + публичный)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /tutors/profile
 * Авторизованный. Редактирование профиля тьютора. 20 в час — норма.
 */
export const tutorProfileUpdateLimiter = createUserLimiter({
  prefix: 'rl:tutor-profile-update',
  windowMs: 60 * 60_000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many profile update requests' },
});

/**
 * GET /tutors (публичный список)
 * Основная страница каталога. Агрессивно кешируется на CDN, но лимитируем
 * прямые запросы к API — 120/мин с IP.
 */
export const tutorListLimiter = createPublicLimiter({
  prefix: 'rl:tutor-list',
  windowMs: 60_000,
  max: 120,
  skipSuccessfulRequests: false,
  message: { error: 'Too many requests' },
});

/**
 * Admin: approve/reject тьютора.
 * 30 действий в минуту — достаточно для ручной верификации.
 */
export const adminTutorActionLimiter = createUserLimiter({
  prefix: 'rl:admin-tutor-action',
  windowMs: 60_000,
  max: 30,
  skipSuccessfulRequests: false,
  message: { error: 'Too many admin tutor actions' },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /quizzes, POST /quizzes/:id/questions
 * Тьютор создаёт квиз/вопросы. 30 в час — норма для подготовки урока.
 */
export const quizCreateLimiter = createUserLimiter({
  prefix: 'rl:quiz-create',
  windowMs: 60 * 60_000,
  max: 30,
  skipSuccessfulRequests: true,
  message: { error: 'Too many quiz creation requests' },
});

/**
 * POST /quizzes/:id/attempts
 * Клиент начинает попытку. 20 в час — учитывает повторные прохождения.
 */
export const quizAttemptLimiter = createUserLimiter({
  prefix: 'rl:quiz-attempt',
  windowMs: 60 * 60_000,
  max: 20,
  skipSuccessfulRequests: false,
  message: { error: 'Too many quiz attempt requests' },
});

/**
 * POST /quizzes/attempts/:id/submit
 * Отправка ответов. 20 в час.
 */
export const quizSubmitLimiter = createUserLimiter({
  prefix: 'rl:quiz-submit',
  windowMs: 60 * 60_000,
  max: 20,
  skipSuccessfulRequests: false,
  message: { error: 'Too many quiz submit requests' },
});

/**
 * SLOTS
 */
export const slotCreateLimiter = createUserLimiter({
  prefix: 'rl:slot-create',
  windowMs: 60 * 60_000,
  max: 60,                    // тьютор может заполнять расписание на месяц вперёд
  skipSuccessfulRequests: true,
  message: { error: 'Too many slot creation requests' },
});

export const slotDeleteLimiter = createUserLimiter({
  prefix: 'rl:slot-delete',
  windowMs: 60 * 60_000,
  max: 60,
  skipSuccessfulRequests: true,
  message: { error: 'Too many slot deletion requests' },
});

/**
 * PROFILE (общий)
 */
export const profileUpdateLimiter = createUserLimiter({
  prefix: 'rl:profile-update',
  windowMs: 60 * 60_000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many profile update requests' },
});