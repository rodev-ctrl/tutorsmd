import { ILessonRepository } from '../../../../domain/repositories/ILessonRepository';
import { ClientId, TutorId, LessonId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';

export interface CancelSingleLessonDto {
  lessonId: string;
  cancelledById: string;
  role: 'client' | 'tutor';
  reason?: string;
}

export class CancelSingleLessonUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
  ) {}

  async execute(dto: CancelSingleLessonDto): Promise<void> {
    const lessonId = new LessonId(dto.lessonId);

    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // Только уроки из серии
    if (!lesson.recurringScheduleId) {
      throw new DomainError(
        'Use CancelLessonUseCase for non-recurring lessons'
      );
    }

    if (dto.role === 'client') {
      const clientId = new ClientId(dto.cancelledById);
      if (lesson.clientId !== clientId.value) {
        throw new DomainError('You are not the client of this lesson');
      }
      const cancelled = lesson.cancelByClient(dto.reason);
      await this.lessonRepo.save(cancelled);
    } else {
      const tutorId = new TutorId(dto.cancelledById);
      if (lesson.tutorId !== tutorId.value) {
        throw new DomainError('You are not the tutor of this lesson');
      }
      const cancelled = lesson.cancelByTutor(dto.reason);
      await this.lessonRepo.save(cancelled);
    }
    // RecurringSchedule остаётся активным — следующий урок генерируется как обычно
  }
}