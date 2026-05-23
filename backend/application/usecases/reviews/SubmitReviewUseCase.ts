import { Review } from '../../../domain/entities/Review';
import { IReviewRepository } from '../../../domain/repositories/IReviewRepository';
import { ILessonRepository } from '../../../domain/repositories/lesson/ILessonRepository';
import { IUUIDGenerator } from '../../ports/IUUIDGenerator';
import { ClientId, TutorId, LessonId } from '../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { DomainError } from '../../../domain/errors/DomainError';
import { ConflictError } from '../../../domain/errors/ConflictError';

export interface SubmitReviewDto {
  clientId: string;
  lessonId: string;
  rating:   number;
  comment?: string | null;
}

export interface SubmitReviewResult {
  reviewId: string;
}

export class SubmitReviewUseCase {
  constructor(
    private readonly reviewRepo:  IReviewRepository,
    private readonly lessonRepo:  ILessonRepository,
    private readonly idGenerator: IUUIDGenerator,
  ) {}

  async execute(dto: SubmitReviewDto): Promise<SubmitReviewResult> {
    const clientId = new ClientId(dto.clientId);
    const lessonId = new LessonId(dto.lessonId);

    // 1. Урок существует
    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // 2. Только клиент этого урока может оставить отзыв
    if (lesson.clientId !== clientId.value) {
      throw new DomainError('You are not the client of this lesson');
    }

    // 3. Отзыв можно оставить только на завершённый урок
    if (lesson.status !== 'completed') {
      throw new DomainError('Review can only be submitted for completed lessons');
    }

    new TutorId(lesson.tutorId);

    // 4. @@unique([clientId, tutorId]) — один отзыв на тьютора от клиента
    const alreadyReviewed = await this.reviewRepo.existsByClientAndTutor(
      clientId.value,
      lesson.tutorId,
    );
    if (alreadyReviewed) {
      throw new ConflictError('You have already reviewed this tutor');
    }

    const review = Review.create({
      id:       this.idGenerator.generate(),
      lessonId: lessonId.value,
      clientId: clientId.value,
      tutorId:  lesson.tutorId,
      rating:   dto.rating,
      comment:  dto.comment ?? null,
    });

    await this.reviewRepo.create(review);

    return { reviewId: review.id };
  }
}