import { Router } from 'express';

import { requireAuth } from '../middlewares/auth/requireAuth';
import { requireRole } from '../middlewares/auth/requireRole';
import { validate } from '../middlewares/validate';
import { privateNoCache, publicYesCache } from "../middlewares/cacheControl";


import { ReviewController } from '../controllers/review/ReviewController';

import {
  SubmitReviewSchema,
  GetTutorReviewsQuerySchema,
  TutorIdParams,
} from '../controllers/review/review.schema';
import { reviewSubmitLimiter } from '../middlewares/rateLimiter';
import { wrap } from './wrapper'; 

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
    privateNoCache,
    requireAuth,
    requireRole('client'),
    reviewSubmitLimiter,
    validate(SubmitReviewSchema),
    wrap((req, res) => controller.submit(req, res)),
  );


  // GET /tutors/:tutorId/reviews
  // Public tutor reviews with cursor pagination
  router.get(
    '/tutors/:tutorId/reviews',
    publicYesCache(60),
    validate(GetTutorReviewsQuerySchema, 'query'),
    wrap<TutorIdParams, {}, {}, { limit?: number; before?: string }>((req, res) => controller.getTutorReviews(req, res)),
  );

  return router;
};