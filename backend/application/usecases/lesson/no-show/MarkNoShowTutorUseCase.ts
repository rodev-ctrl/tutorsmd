import { ILessonRepository } from '../../../../domain/repositories/lesson/ILessonRepository';
import { AdminId, LessonId } from '../../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../../domain/errors/NotFoundError';

export interface MarkNoShowTutorDto {
  lessonId: string;
  adminId: string; // только admin может вызывать
}

export class MarkNoShowTutorUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
  ) {}

  async execute(dto: MarkNoShowTutorDto): Promise<void> {
    const lessonId = new LessonId(dto.lessonId);
    new AdminId(dto.adminId); // валидация UUID

    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // Domain method проверяет статус
    const noShow = lesson.markNoShowTutor();
    await this.lessonRepo.save(noShow);
  }
}