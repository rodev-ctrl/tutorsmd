import { PrismaClient } from '../../../../generated/prisma';
import { IRefreshTokenRepository, CreateRefreshTokenDto } from '../../../domain/repositories/IRefreshTokenRepository';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRefreshTokenDto): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        deviceInfo: data.deviceInfo,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<{
    userId: string;
    tokenHash: string;
    deviceInfo: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
  } | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record) return null;
    return {
      userId: record.userId,
      tokenHash: record.tokenHash,
      deviceInfo: record.deviceInfo,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    };
  }

  async revoke(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}