export interface LessonSummaryDto {
  id:        string;
  lessonId:  string;
  content:   string;   // markdown от Claude
  model:     string;   // "claude-sonnet-5" — для аудита
  createdAt: Date;
}

export interface ILessonSummaryRepository {
  findByLessonId(lessonId: string): Promise<LessonSummaryDto | null>;
}
