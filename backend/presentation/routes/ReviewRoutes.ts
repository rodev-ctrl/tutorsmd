// reviewRoutes.ts
import { Router } from 'express';
const router = Router();

import { requireAuth } from '../middlewares/requireAuth';
import { ReviewController } from '../controllers/reviewController';


router.get('/tutors/:tutorId/reviews', ReviewController.listByTutor);
router.get('/tutors/:tutorId/reviews/me', requireAuth, ReviewController.getMyForTutor);
router.post('/tutors/:tutorId/reviews', requireAuth, ReviewController.createForTutor);
router.put('/reviews/:reviewId', requireAuth, ReviewController.updateOwn);

export default router;
