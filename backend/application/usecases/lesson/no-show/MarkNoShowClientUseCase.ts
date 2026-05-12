import { ILessonRepository } from '../../../../domain/repositories/ILessonRepository';
import { TutorId, LessonId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';
import { DomainError } from '../../../../domain/errors/DomainError';

export interface MarkNoShowClientDto {
  lessonId: string;
  tutorId: string;
}

export class MarkNoShowClientUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
  ) {}

  async execute(dto: MarkNoShowClientDto): Promise<void> {
    const lessonId = new LessonId(dto.lessonId);
    const tutorId = new TutorId(dto.tutorId);

    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    if (lesson.tutorId !== tutorId.value) {
      throw new DomainError('You are not the tutor of this lesson');
    }

    // Domain method проверяет временное окно (+15мин до +24ч)
    const noShow = lesson.markNoShowClient();
    await this.lessonRepo.save(noShow);
  }
}