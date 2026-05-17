import { ILessonRepository } from '../../../domain/repositories/ILessonRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { ClientId, LessonId, TutorId } from '../../../domain/value-objects/EntityId';
import { Lesson } from '../../../domain/entities/Lesson';

export interface CancelLessonDto {
  lessonId: string;
  cancelledByUserId: string; 
  role: 'client' | 'tutor';
  reason?: string;
}

export class CancelLessonUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository
  ) {}

  async execute(dto: CancelLessonDto): Promise<void> {
    const lesson = await this.lessonRepo.findById(new LessonId(dto.lessonId).value);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await this.cancelLesson(lesson, dto);
  }

  async cancelLesson(lesson: Lesson, dto: Omit<CancelLessonDto, 'lessonId'>): Promise<void> {
    if (dto.role === 'client') {
      const clientId = new ClientId(dto.cancelledByUserId);
      if (lesson.clientId !== clientId.value) {
        throw new DomainError('You are not the client of this lesson');
      }
      // pending → клиент может отменить без ограничения по времени
      // confirmed → domain method проверяет окно (< 2ч)
      const cancelled = lesson.cancelByClient(dto.reason);
      await this.lessonRepo.save(cancelled);

    } else {
      const tutorId = new TutorId(dto.cancelledByUserId);
      if (lesson.tutorId !== tutorId.value) {
        throw new DomainError('You are not the tutor of this lesson');
      }
      
      const cancelled = lesson.cancelByTutor(dto.reason);
      await this.lessonRepo.save(cancelled);
    }
  }
}