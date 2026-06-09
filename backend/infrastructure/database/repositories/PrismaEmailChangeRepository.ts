import { PrismaClient } from '@prisma/client';
import { EmailChangeRecord, IEmailChangeRepository } from '../../../domain/repositories/email/IEmailChangeRepository';

export class PrismaEmailChangeRepository implements IEmailChangeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: {
    userId: string;
    newEmail: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.emailChange.upsert({
      where: { userId: data.userId },
      update: {
        newEmail: data.newEmail,
        linkHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
      create: {
        userId: data.userId,
        newEmail: data.newEmail,
        linkHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.emailChange.deleteMany({ where: { userId } });
  }

  async consumeToken(tokenHash: string): Promise<EmailChangeRecord | null> {
  try {

     const record = await this.prisma.emailChange.findUnique({
      where: { linkHash: tokenHash },
    });

    if (!record) return null;
    
    // DELETE ... RETURNING - атомарно, только 1 запрос получит запись
    await this.prisma.emailChange.delete({
      where: { id: record.id },
    });
   return {
      id:        record.id,
      userId:    record.userId,
      newEmail:  record.newEmail,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };
  } catch {
    return null;
  }
}
}