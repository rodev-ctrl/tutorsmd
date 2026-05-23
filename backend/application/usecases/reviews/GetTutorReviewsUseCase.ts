import { IReviewRepository, ReviewRecord } from '../../../domain/repositories/IReviewRepository';
import { TutorId } from '../../../domain/value-objects/EntityId';

export interface GetTutorReviewsDto {
  tutorId: string;
  limit?:  number;
  before?: string; // ISO datetime — cursor для пагинации
}

export interface GetTutorReviewsResult {
  reviews:    ReviewRecord[];
  nextCursor: string | null; // createdAt последнего элемента, null если записей больше нет
}

export class GetTutorReviewsUseCase {
  constructor(
    private readonly reviewRepo: IReviewRepository,
  ) {}

  async execute(dto: GetTutorReviewsDto): Promise<GetTutorReviewsResult> {
    const tutorId = new TutorId(dto.tutorId);
    const limit   = Math.min(dto.limit ?? 20, 100);
    const before  = dto.before ? new Date(dto.before) : undefined;

    const reviews = await this.reviewRepo.findByTutorId({
      tutorId: tutorId.value,
      limit,
      before,
    });

    const nextCursor = reviews.length === limit
      ? reviews[reviews.length - 1].createdAt.toISOString()
      : null;

    return { reviews, nextCursor };
  }
}