export interface ILessonSummaryService {
  /**
   * Triggert die Zusammenfassung im ai-service.
   * Der ai-service besitzt die komplette Logik (Transkript holen, Claude aufrufen,
   * Ergebnis in lesson_summaries speichern) — Node löst hier nur noch aus.
   */
  generateSummary(lessonId: string): Promise<void>;
}