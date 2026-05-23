import { Request, Response } from 'express';

export interface IQuizController {
  createQuiz(req: Request, res: Response): Promise<void>;
  addQuestion(req: Request, res: Response): Promise<void>;
  assignToLesson(req: Request, res: Response): Promise<void>;
  startAttempt(req: Request, res: Response): Promise<void>;
  submitAttempt(req: Request, res: Response): Promise<void>;
  provideAnswerFeedback(req: Request, res: Response): Promise<void>;
}