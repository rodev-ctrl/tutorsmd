import jwt from 'jsonwebtoken';

const SERVICE_TOKEN_TTL_SECONDS = 60;

/**
 * Kurzlebiger Token für backend → ai-service Aufrufe.
 * Bewusst getrennt von JWT_ACCESS_SECRET (Nutzer-Sessions): Hintergrund-Jobs
 * (z.B. AutoCompleteLessonsJob per Cron) haben keinen Nutzer-Access-Token im
 * Kontext, also braucht der Service-zu-Service-Aufruf ein eigenes Secret,
 * das nicht an eine konkrete Nutzer-Session gebunden ist.
 *
 * userId ist optional, weil nicht jeder Aufruf einen anfragenden Nutzer hat
 * (s.o., Cron-Jobs). Wird er übergeben, trägt der Token die Identität des
 * Nutzers, für den backend diesen Aufruf stellt — ai-service verifiziert
 * damit in retrieval.py, dass requester_id im Body wirklich zu dieser
 * Identität gehört, statt dem Body blind zu vertrauen.
 */
export function signServiceToken(userId?: string): string {
  const secret = process.env.JWT_AI_SERVICE_SECRET;
  if (!secret) throw new Error('JWT_AI_SERVICE_SECRET is required for service-to-service calls to ai-service');

  const claims = userId ? { service: 'backend', user_id: userId } : { service: 'backend' };
  return jwt.sign(claims, secret, { expiresIn: SERVICE_TOKEN_TTL_SECONDS });
}
