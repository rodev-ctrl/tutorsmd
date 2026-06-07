import { PrismaClient } from '@prisma/client';
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

    // ── 1. Автостарт confirmed уроков у которых наступило scheduledAt ─────────
    const toStart = await this.prisma.lesson.findMany({
      where: {
        status: 'confirmed',
        scheduledAt: { lte: now },
      },
      select: { id: true, tutorId: true, scheduledAt: true, durationMinutes: true },
    });

    for (const lesson of toStart) {
      const expectedEnd = new Date(
        lesson.scheduledAt.getTime() + lesson.durationMinutes * 60 * 1000,
      );

      // Если время урока уже вышло — сразу completed, не in_progress
      if (now >= expectedEnd) {
        try {
          await this.prisma.lesson.update({
            where: { id: lesson.id },
            data: {
              status:      'completed',
              startedAt:   lesson.scheduledAt,
              completedAt: expectedEnd,
              updatedAt:   now,
            },
          });
          this.onLessonCompleted?.(lesson.id);
          console.log(`[AutoComplete] Урок ${lesson.id} пропущен → completed.`);
        } catch (err) {
          console.error(`[AutoComplete] Ошибка completed для ${lesson.id}:`, err);
        }
        continue;
      }

      // scheduledAt наступило, но урок ещё идёт → in_progress
      try {
        await this.prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            status:    'in_progress',
            startedAt: lesson.scheduledAt,
            updatedAt: now,
          },
        });
        console.log(`[AutoComplete] Урок ${lesson.id} → in_progress.`);
      } catch (err) {
        console.error(`[AutoComplete] Ошибка in_progress для ${lesson.id}:`, err);
      }
    }

    // ── 2. Автозавершение in_progress уроков у которых вышло время ───────────
    const toComplete = await this.prisma.lesson.findMany({
      where: {
        status:    'in_progress',
        startedAt: { not: null },
      },
      select: { id: true, tutorId: true, startedAt: true, durationMinutes: true },
    });

    for (const lesson of toComplete) {
      const expectedEnd = new Date(
        lesson.startedAt!.getTime() + lesson.durationMinutes * 60 * 1000,
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
        console.log(`[AutoComplete] Урок ${lesson.id} → completed.`);
      } catch (err) {
        console.error(`[AutoComplete] Ошибка для урока ${lesson.id}:`, err);
      }
    }
  }
}