// infrastructure/queue/jobs/AutoCompleteLessonsJob.ts
import { PrismaClient } from '../../../generated/prisma';
import { CompleteLessonUseCase } from '../../../application/usecases/lesson/CompleteLessonUseCase';
import { GenerateNextRegularLessonUseCase } from '../../../application/usecases/lesson/regular/GenerateNextRegularScheduleUseCase';

export class AutoCompleteLessonsJob {

  constructor(
    private readonly prisma:                    PrismaClient,
    private readonly completeLessonUseCase:     CompleteLessonUseCase,
    private readonly generateNextRegularLesson: GenerateNextRegularLessonUseCase,
    private readonly onLessonCompleted:         (lessonId: string) => void,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    

    const lessons = await this.prisma.lesson.findMany({
      where: {
        status:    'in_progress',
        startedAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) },
      },
      select: {
        id:              true,
        tutorId:         true,
        startedAt:       true,
        durationMinutes: true,
      },
    });

    for (const lesson of lessons) {
      const expectedEnd = new Date(
        lesson.startedAt!.getTime() + lesson.durationMinutes * 60 * 1000
      );

      if (now < expectedEnd) continue;

      try {
        await this.completeLessonUseCase.execute({
          lessonId: lesson.id,
          tutorId:  lesson.tutorId,
        });

        await this.generateNextRegularLesson.execute({
          completedLessonId: lesson.id,
        });

        this.onLessonCompleted?.(lesson.id);

        console.log(`[AutoComplete] Урок ${lesson.id} завершён.`);
      } catch (err) {
        console.error(`[AutoComplete] Ошибка для урока ${lesson.id}:`, err);
      }
    }
  }
}