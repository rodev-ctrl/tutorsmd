import { Request, Response } from 'express';

export interface IFeedbackController {
  submit(req: Request, res: Response): Promise<void>;
}