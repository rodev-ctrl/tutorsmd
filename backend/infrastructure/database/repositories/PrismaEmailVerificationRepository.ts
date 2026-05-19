import { PrismaClient } from '../../../generated/prisma';
import { IEmailVerificationRepository } from '../../../domain/repositories/email/IEmailVerificationRepository';

export class PrismaEmailVerificationRepository implements IEmailVerificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.prisma.emailVerification.upsert({
      where: { userId: data.userId },
      update: {
        linkHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
      create: {
        userId: data.userId,
        linkHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<{ userId: string; tokenHash: string; expiresAt: Date } | null> {
    const record = await this.prisma.emailVerification.findUnique({
      where: { linkHash: tokenHash },
    });
    if (!record) return null;
    return {
      userId: record.userId,
      tokenHash: record.linkHash,
      expiresAt: record.expiresAt,
    };
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.emailVerification.delete({
      where: { userId },
    }).catch(() => {
      // Игнорируем если записи нет
    });
  }
}