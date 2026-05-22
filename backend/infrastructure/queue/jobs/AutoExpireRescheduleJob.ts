
// pending_reschedule уроки у которых proposedExpiresAt < now
// возвращаем в confirmed (предложение истекло)
import { PrismaClient } from '../../../generated/prisma';

export class AutoExpireRescheduleJob {
  constructor(private readonly prisma: PrismaClient) {}

  async run(): Promise<void> {
    const now = new Date();

    const result = await this.prisma.lesson.updateMany({
      where: {
        status: 'pending_reschedule',
        proposedExpiresAt: { lt: now },
      },
      data: {
        status: 'confirmed',
        proposedScheduledAt: null,
        proposedExpiresAt: null,
        updatedAt: now,
      },
    });

    if (result.count > 0) {
      console.log(`[AutoExpireReschedule] Истекло ${result.count} предложений переноса.`);
    }
  }
}