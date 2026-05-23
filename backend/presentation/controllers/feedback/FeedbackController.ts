import { Request, Response } from 'express';
import { IFeedbackController } from './IFeedbackController';
import { SubmitFeedbackUseCase } from '../../../application/usecases/feedback/SubmitFeedbackUseCase';
import { SubmitFeedbackBody } from './feedback.schema';

export class FeedbackController implements IFeedbackController {
  constructor(
    private readonly submitFeedbackUseCase: SubmitFeedbackUseCase,
  ) {}

  async submit(req: Request<{}, {}, SubmitFeedbackBody>, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { text } = req.body;

    await this.submitFeedbackUseCase.execute({ userId, text });

    res.status(201).json({ message: 'Feedback submitted.' });
  }
}