export interface IQuizAnswerRepository {
  updateEarnedPoints(answerId: string, earnedPoints: number | null): Promise<void>;
  getTotalEarnedPoints(attemptId: string): Promise<number>;
}