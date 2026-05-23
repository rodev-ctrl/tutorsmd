import { IReviewRepository, ReviewRecord, GetTutorReviewsOptions } from '../../../domain/repositories/IReviewRepository';
import { Review } from '../../../domain/entities/Review';
import { PrismaClient } from '../../../generated/prisma';

export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(review: Review): Promise<void> {
    await this.prisma.review.create({
      data: {
        id:       review.id,
        lessonId: review.lessonId,
        clientId: review.clientId,
        tutorId:  review.tutorId,
        rating:   review.rating,
        comment:  review.comment,
      },
    });
  }

  async existsByClientAndTutor(clientId: string, tutorId: string): Promise<boolean> {
    const count = await this.prisma.review.count({
      where: { clientId, tutorId },
    });
    return count > 0;
  }

  async findByTutorId(options: GetTutorReviewsOptions): Promise<ReviewRecord[]> {
    const { tutorId, limit = 20, before } = options;

    const rows = await this.prisma.review.findMany({
      where: {
        tutorId,
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id:               true,
        lessonId:         true,
        clientId:         true,
        tutorId:          true,
        rating:           true,
        comment:          true,
        tutorResponse:    true,
        tutorRespondedAt: true,
        createdAt:        true,
      },
    });

    return rows;
  }
}