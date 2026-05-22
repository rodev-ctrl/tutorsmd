import { PrismaClient } from '../../../generated/prisma';
import {
  IRefreshTokenRepository,
  CreateRefreshTokenDto,
  RefreshTokenRecord,
} from '../../../domain/repositories/IRefreshTokenRepository';

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

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record) return null;
    return this.toRecord(record);
  }

  // Только активные сессии — для страницы "активные устройства"
  async findActiveByUserId(userId: string): Promise<RefreshTokenRecord[]> {
    const records = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(this.toRecord);
  }

  // Все сессии включая revoked — для истории входов
  async findAllByUserId(userId: string): Promise<RefreshTokenRecord[]> {
    const records = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(this.toRecord);
  }

  async revoke(tokenHash: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return result.count > 0;
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toRecord(record: any): RefreshTokenRecord {
    return {
      userId: record.userId,
      tokenHash: record.tokenHash,
      deviceInfo: record.deviceInfo,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      createdAt: record.createdAt,
    };
  }
}