
// Напоминания за 24ч и за 1ч до урока
// Запускается каждые 15 минут — окно ±15 минут от точного времени

import { PrismaClient } from '../../../generated/prisma';
import { IEmailService } from '../../../application/ports/IEmailService';
import { LanguageCode } from '../../../domain/entities/User';

const REMINDER_WINDOWS = [
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: '1h',  ms:      60 * 60 * 1000 },
];

const WINDOW_MS = 15 * 60 * 1000; // 15 минут

export class SendLessonRemindersJob {
  constructor(
    private readonly prisma:        PrismaClient,
    private readonly emailService:  IEmailService,
  ) {}

  async run(): Promise<void> {
    const now = new Date();

    for (const window of REMINDER_WINDOWS) {
      const targetTime   = new Date(now.getTime() + window.ms);
      const windowStart  = new Date(targetTime.getTime() - WINDOW_MS);
      const windowEnd    = new Date(targetTime.getTime() + WINDOW_MS);

      const lessons = await this.prisma.lesson.findMany({
        where: {
          status: 'confirmed',
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
        select: {
          id: true,
          scheduledAt: true,
          client: { select: { user: { select: { email: true, name: true, languageCode: true } } } },
          tutor:  { select: { user: { select: { email: true, nameDe: true, languageCode: true } } } },
        },
      });

      for (const lesson of lessons) {
        try {
            const timeStr = lesson.scheduledAt.toISOString();
          // Email клиенту
           await this.emailService.sendLessonReminder(
            lesson.client.user.email,
            timeStr,
            lesson.client.user.languageCode as LanguageCode,
          );

          // Email тьютору
          await this.emailService.sendLessonReminder(
            lesson.tutor.user.email,
            timeStr,
            lesson.tutor.user.languageCode as LanguageCode,
          );

          console.log(`[Reminders] ${window.label} напоминание для урока ${lesson.id} отправлено.`);
        } catch (err) {
          console.error(`[Reminders] Ошибка для урока ${lesson.id}:`, err);
        }
      }
    }
  }
}
