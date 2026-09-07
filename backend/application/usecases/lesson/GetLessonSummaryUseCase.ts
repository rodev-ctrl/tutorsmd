// application/usecases/lesson/GetLessonSummaryUseCase.ts
import { ILessonRepository } from '../../../domain/repositories/lesson/ILessonRepository';
import { ILessonSummaryRepository } from '../../ports/ILessonSummaryRepository';
import { ClientId, TutorId, LessonId } from '../../../domain/value-objects/EntityId';
import { NotFoundError } from '../../../domain/errors/NotFoundError';
import { DomainError } from '../../../domain/errors/DomainError';

export interface GetLessonSummaryDto {
  lessonId:      string;
  requesterId:   string;       // client.id или tutor.id
  requesterRole: 'client' | 'tutor';
}

export type GetLessonSummaryResult =
  | { status: 'not_ready' }
  | { status: 'ready'; content: string; model: string; createdAt: Date };

export class GetLessonSummaryUseCase {
  constructor(
    private readonly lessonRepo: ILessonRepository,
    private readonly summaryRepo: ILessonSummaryRepository,
  ) {}

  async execute(dto: GetLessonSummaryDto): Promise<GetLessonSummaryResult> {
    const lessonId = new LessonId(dto.lessonId);

    const lesson = await this.lessonRepo.findById(lessonId.value);
    if (!lesson) throw new NotFoundError('Lesson not found');

    // Тот же паттерн проверки участника, что и в AskAboutMaterialsUseCase
    if (dto.requesterRole === 'client') {
      const clientId = new ClientId(dto.requesterId);
      if (lesson.clientId !== clientId.value) {
        throw new DomainError('You are not the client of this lesson');
      }
    } else {
      const tutorId = new TutorId(dto.requesterId);
      if (lesson.tutorId !== tutorId.value) {
        throw new DomainError('You are not the tutor of this lesson');
      }
    }

    const summary = await this.summaryRepo.findByLessonId(dto.lessonId);
    // Саммари генерируется асинхронно (BullMQ) после completion — окно, когда
    // урок уже completed, а саммари ещё нет, это нормальное состояние, не ошибка.
    if (!summary) return { status: 'not_ready' };

    return {
      status:    'ready',
      content:   summary.content,
      model:     summary.model,
      createdAt: summary.createdAt,
    };
  }
}
