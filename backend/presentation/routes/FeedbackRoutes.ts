import { Router } from 'express';
import { requireAuth } from '../middlewares/auth/requireAuth';
import { validate } from '../middlewares/validate';
import { SubmitFeedbackSchema } from '../controllers/feedback/feedback.schema';

export const createFeedbackRouter = (controller: any): Router => {
  const router = Router();

  // POST /feedback
  router.post('/', requireAuth, validate(SubmitFeedbackSchema), (req, res) => controller.submitFeedback(req, res));

  return router;
};