export interface ILessonSummaryService {
  generateSummary(transcript: string): Promise<string>;
}