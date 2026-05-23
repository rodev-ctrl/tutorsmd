import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { PrismaClient } from '../../../generated/prisma';

export class PrismaFeedbackRepository implements IFeedbackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { id: string; userId: string; text: string }): Promise<void> {
    await this.prisma.feedback.create({
      data: {
        id:     data.id,
        userId: data.userId,
        text:   data.text,
      },
    });
  }
}