import { ILessonRepository } from '../../../domain/repositories/lesson/ILessonRepository';
import { Lesson } from '../../../domain/entities/Lesson';
import { LessonId } from '../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { DomainError } from '../../../domain/errors/DomainError';

export interface GetUserLessonDto {
  lessonId: string;
  profileId: string;
}

export class GetUserLessonUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
  ) {}

  async execute(dto: GetUserLessonDto): Promise<Lesson> {
    const lessonId = new LessonId(dto.lessonId);

    const lesson = await this.lessonRepo.findById(lessonId.value);

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    // Проверяем что пользователь участник урока
    const isParticipant =
        lesson.clientId === dto.profileId ||
        lesson.tutorId === dto.profileId;

    if (!isParticipant) {
      throw new DomainError(
        'You do not have access to this lesson',
      );
    }

    return lesson;
  }
}