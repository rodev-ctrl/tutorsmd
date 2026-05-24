import { Router } from 'express';

import { requireAuth } from '../middlewares/auth/requireAuth';
import { requireRole } from '../middlewares/auth/requireRole';
import { validate } from '../middlewares/validate';

import { ReviewController } from '../controllers/review/ReviewController';

import {
  SubmitReviewSchema,
  GetTutorReviewsQuerySchema,
} from '../controllers/review/review.schema';

export const createReviewRouter = (
  controller: ReviewController,
): Router => {
  const router = Router();

  // ───────────────────────────────────────────────────────────
  // Reviews
  // ───────────────────────────────────────────────────────────

  // POST /reviews
  // Client submits review for completed lesson
  router.post(
    '/',
    requireAuth,
    requireRole('client'),
    validate(SubmitReviewSchema),
    (req, res) => controller.submit(req, res),
  );

  // GET /tutors/:tutorId/reviews
  // Public tutor reviews with cursor pagination
  router.get(
    '/tutors/:tutorId/reviews',
    validate(GetTutorReviewsQuerySchema, 'query'),
    (req, res) => controller.getTutorReviews(req as any, res),
  );

  return router;
};