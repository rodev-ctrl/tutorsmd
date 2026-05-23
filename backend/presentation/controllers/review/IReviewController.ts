import { Request, Response } from 'express';

export interface IReviewController {
  submit(req: Request, res: Response): Promise<void>;
  getTutorReviews(req: Request, res: Response): Promise<void>;
}