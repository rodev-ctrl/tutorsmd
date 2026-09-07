import { PrismaClient } from '@prisma/client';
import { ILessonSummaryRepository, LessonSummaryDto } from '../../../application/ports/ILessonSummaryRepository';

export class PrismaLessonSummaryRepository implements ILessonSummaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByLessonId(lessonId: string): Promise<LessonSummaryDto | null> {
    const record = await this.prisma.lessonSummary.findUnique({
      where: { lessonId },
    });
    if (!record) return null;

    return {
      id:        record.id,
      lessonId:  record.lessonId,
      content:   record.content,
      model:     record.model,
      createdAt: record.createdAt,
    };
  }
}
