import { Request, Response } from 'express';
import { IReviewController } from './IReviewController';
import { SubmitReviewUseCase } from '../../../application/usecases/reviews/SubmitReviewUseCase';
import { GetTutorReviewsUseCase } from '../../../application/usecases/reviews/GetTutorReviewsUseCase';

export class ReviewController implements IReviewController {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly getTutorReviewsUseCase: GetTutorReviewsUseCase,
  ) {}

  // POST /reviews
  // body: { lessonId, rating, comment? }
  // JWT: clientId
  async submit(req: Request, res: Response): Promise<void> {
    const clientId = req.user!.userId;
    const { lessonId, rating, comment } = req.body;

    await this.submitReviewUseCase.execute({ clientId, lessonId, rating, comment });

    res.status(201).json({ message: 'Review submitted.' });
  }

  // GET /tutors/:tutorId/reviews?limit=10&before=2024-01-15T10:00:00.000Z
  async getTutorReviews(req: Request, res: Response): Promise<void> {
    const { tutorId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const before = req.query.before ? String(req.query.before) : undefined;

    
    const result = await this.getTutorReviewsUseCase.execute({tutorId, limit, before});

    res.status(200).json({ result });
  }
}