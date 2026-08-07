import { ILessonSummaryService } from '../../../../application/ports/ILessonSummaryService';

export class GenerateLessonSummaryJob {
  constructor(
    private readonly summaryService: ILessonSummaryService,
  ) {}

  async run(lessonId: string): Promise<void> {
    try {
      await this.summaryService.generateSummary(lessonId);
      console.log(`[LessonSummary] Anfrage für Lektion ${lessonId} an ai-service gesendet.`);
    } catch (err) {
      console.error(`[LessonSummary] Fehler für Lektion ${lessonId}:`, err);
    }
  }
}
