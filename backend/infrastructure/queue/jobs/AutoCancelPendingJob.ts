import { PrismaClient } from '@prisma/client';

const PENDING_EXPIRY_HOURS = 24;
const TOKEN_CLEANUP_DAYS = 1; // удаляем отозванные/истёкшие токены старше 1 дня

export class AutoCancelPendingJob {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async run(): Promise<void> {
    await this.cancelPendingLessons();
    await this.cleanupExpiredTokens();
  }

  // --- Отмена pending уроков старше 24ч ---------------------------------------
  private async cancelPendingLessons(): Promise<void> {
    const expiryTime = new Date(
      Date.now() - PENDING_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const result = await this.prisma.lesson.updateMany({
      where: {
        status: 'pending',
        createdAt: { lt: expiryTime },
      },
      data: {
        status: 'cancelled_by_tutor',
        cancellationReason: 'Auto-cancelled: tutor did not confirm within 24 hours',
        updatedAt: new Date(),
      },
    });

    if (result.count > 0) {
      console.log(`[AutoCancelPending] Отменено ${result.count} уроков.`);
    }
  }

  // --- Очистка отозванных и истёкших refresh tokens ----------------------------
  // Удаляем токены где:
  //  - revokedAt IS NOT NULL (токен использован при rotation)
  //  - expiresAt < NOW()     (токен истёк естественно)
  // Держим 1 день буфер — на случай если нужно расследовать "token reuse"
  private async cleanupExpiredTokens(): Promise<void> {
    const cutoff = new Date(Date.now() - TOKEN_CLEANUP_DAYS * 24 * 60 * 60 * 1000);

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { revokedAt: { not: null, lt: cutoff } }, // отозванные старше 1 дня
          { expiresAt: { lt: new Date() } }, // истёкшие
        ],
      },
    });

    if (result.count > 0) {
      console.log(`[TokenCleanup] Удалено ${result.count} устаревших токенов.`);
    }
  }
}