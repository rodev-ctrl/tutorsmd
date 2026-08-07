import jwt from 'jsonwebtoken';

const SERVICE_TOKEN_TTL_SECONDS = 60;

/**
 * Kurzlebiger Token für backend → ai-service Aufrufe.
 * Bewusst getrennt von JWT_ACCESS_SECRET (Nutzer-Sessions): Hintergrund-Jobs
 * (z.B. AutoCompleteLessonsJob per Cron) haben keinen Nutzer-Access-Token im
 * Kontext, also braucht der Service-zu-Service-Aufruf ein eigenes Secret,
 * das nicht an eine konkrete Nutzer-Session gebunden ist.
 */
export function signServiceToken(): string {
  const secret = process.env.JWT_AI_SERVICE_SECRET;
  if (!secret) throw new Error('JWT_AI_SERVICE_SECRET is required for service-to-service calls to ai-service');

  return jwt.sign({ service: 'backend' }, secret, { expiresIn: SERVICE_TOKEN_TTL_SECONDS });
}
