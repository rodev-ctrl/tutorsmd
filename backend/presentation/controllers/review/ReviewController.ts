import { Request, Response } from 'express';

import { SubmitReviewUseCase } from '../../../application/usecases/reviews/SubmitReviewUseCase';
import { GetTutorReviewsUseCase } from '../../../application/usecases/reviews/GetTutorReviewsUseCase';


import {
  SubmitReviewBody,
  GetTutorReviewsQueryDto,
} from './review.schema';

type TutorIdParams = {
  tutorId: string;
};

export class ReviewController {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly getTutorReviewsUseCase: GetTutorReviewsUseCase,
  ) {}

  async submit(
    req: Request<{}, {}, SubmitReviewBody>,
    res: Response,
  ): Promise<void> {
    const clientId = req.user!.profileId;

    const {
      lessonId,
      rating,
      comment,
    } = req.body;

    await this.submitReviewUseCase.execute({
      clientId,
      lessonId,
      rating,
      comment,
    });

    res.status(201).json({
      message: 'Review submitted.',
    });
  }

  async getTutorReviews(
    req: Request<
      TutorIdParams,
      {},
      {},
      GetTutorReviewsQueryDto
    >,
    res: Response,
  ): Promise<void> {
    const { tutorId } = req.params;

    const {
      limit,
      before,
    } = req.query;

    const result =
      await this.getTutorReviewsUseCase.execute({
        tutorId,
        limit,
        before,
      });

    res.status(200).json({
      result,
    });
  }
}