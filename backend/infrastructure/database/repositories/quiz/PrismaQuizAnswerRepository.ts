import { PrismaClient } from '../../../../generated/prisma';
import { IQuizAnswerRepository } from '../../../../domain/repositories/quiz/IQuizAnswerRepository';

export class PrismaQuizAnswerRepository implements IQuizAnswerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async updateEarnedPoints(answerId: string, earnedPoints: number | null): Promise<void> {
    await this.prisma.quizAnswer.update({
      where: { id: answerId },
      data: {
        earnedPoints,
        updatedAt: new Date(),
      },
    });
  }

  async getTotalEarnedPoints(attemptId: string): Promise<number> {
    const result = await this.prisma.quizAnswer.aggregate({
      where: { attemptId },
      _sum: { earnedPoints: true },
    });
    return result._sum.earnedPoints ?? 0;
  }
}