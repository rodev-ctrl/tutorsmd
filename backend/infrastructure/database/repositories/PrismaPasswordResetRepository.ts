import { PrismaClient } from '@prisma/client';
import { IPasswordResetRepository, PasswordResetRecord } from '../../../domain/repositories/IPasswordResetRepository';

export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.prisma.passwordReset.upsert({
      where: { userId: data.userId },
      update: { linkHash: data.tokenHash, expiresAt: data.expiresAt },
      create: { userId: data.userId, linkHash: data.tokenHash, expiresAt: data.expiresAt },
    });
  }
 
/*
  async findByTokenHash(tokenHash: string): Promise<{ userId: string; tokenHash: string; expiresAt: Date } | null> {
    const record = await this.prisma.passwordReset.findUnique({
      where: { linkHash: tokenHash },
      select: { userId: true, expiresAt: true },
    });
    return record ? { ...record, tokenHash } : null;
  }
*/
    async consumeToken(tokenHash: string): Promise<PasswordResetRecord | null> {
    try {
  
       const record = await this.prisma.passwordReset.findUnique({
        where: { linkHash: tokenHash },
      });
  
      if (!record) return null;
      
      // DELETE ... RETURNING - атомарно, только 1 запрос получит запись
      await this.prisma.passwordReset.delete({
        where: { id: record.id },
      });
     return {
        id:        record.id,
        userId:    record.userId,
        expiresAt: record.expiresAt,
        tokenHash: record.linkHash,
      };
    } catch {
      return null;
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordReset.deleteMany({ where: { userId } });
  }
}