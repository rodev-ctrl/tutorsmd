import { PrismaClient } from '../../../generated/prisma';

const PENDING_EXPIRY_HOURS = 24;

export class AutoCancelPendingJob {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async run(): Promise<void> {
    const expiryTime = new Date(
      Date.now() - PENDING_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const result = await this.prisma.lesson.updateMany({
      where: {
        status:    'pending',
        createdAt: { lt: expiryTime },
      },
      data: {
        status:             'cancelled_by_tutor',
        cancellationReason: 'Auto-cancelled: tutor did not confirm within 24 hours',
        updatedAt:          new Date(),
      },
    });

    if (result.count > 0) {
      console.log(`[AutoCancelPending] Отменено ${result.count} уроков.`);
    }
  }
}