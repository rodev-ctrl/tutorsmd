export interface CreateFeedbackData {
  id: string;
  answerId: string;
  tutorId: string;
  comment: string | null;
  isCorrect: boolean | null;
}

export interface UpdateFeedbackData {
  answerId: string;
  comment: string | null;
  isCorrect: boolean | null;
}

export interface IQuizAnswerFeedbackRepository {
  existsByAnswer(answerId: string): Promise<boolean>;
  create(data: CreateFeedbackData): Promise<void>;
  save(data: UpdateFeedbackData): Promise<void>;
}