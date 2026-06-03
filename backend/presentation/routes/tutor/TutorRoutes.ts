import { Router } from 'express';
import { ITutorController } from '../../controllers/tutor/ITutorController';
import { requireAuth } from '../../middlewares/auth/requireAuth';
import { requireRole } from '../../middlewares/auth/requireRole';
import { validate } from '../../middlewares/validate';
import { wrap } from '../wrapper';
import {
  UpdateTutorProfileSchema,
  RejectTutorSchema,
  TutorIdParamsSchema,
} from '../../controllers/tutor/tutor.schema';
import { tutorProfileUpdateLimiter, adminTutorActionLimiter } from '../../middlewares/rateLimiter';

export const createTutorRouter = (controller: ITutorController): Router => {
  const router = Router();

  // ─── Tutor ─────────────────────────────────────────────

  router.get(
    '/profile',
    requireAuth,
    requireRole('tutor'),
    wrap(async (req, res) => {
      await controller.getProfile(req as any, res);
    }),
  );

  router.put(
    '/profile',
    requireAuth,
    requireRole('tutor'),
    tutorProfileUpdateLimiter,
    validate(UpdateTutorProfileSchema),
    wrap(async (req, res) => {
      await controller.updateProfile(req as any, res);
    }),
  );

   // Тьютор подаёт заявку
  router.post('/submit', requireAuth, requireRole('tutor'),
    wrap(async (req, res) => controller.submit(req as any, res)));

  // ─── Admin ─────────────────────────────────────────────

  router.get(
    '/admin/pending',
    requireAuth,
    requireRole('admin'),
    wrap(async (req, res) => {
      await controller.getPendingTutors(req as any, res);
    }),
  );

    // Полный профиль для админа
  router.get('/:tutorId/admin/review', requireAuth, requireRole('admin'),
    validate(TutorIdParamsSchema, 'params'),
    wrap(async (req, res) => controller.getReviewProfile(req as any, res)));

      // Начать проверку
  router.post('/:tutorId/admin/start-review', requireAuth, requireRole('admin'),
    adminTutorActionLimiter,
    validate(TutorIdParamsSchema, 'params'),
    wrap(async (req, res) => controller.startReview(req as any, res)));

  router.post(
    '/:tutorId/admin/approve',
    requireAuth,
    requireRole('admin'),
    adminTutorActionLimiter,
    validate(TutorIdParamsSchema, 'params'),
    wrap(async (req, res) => {
      await controller.approve(req as any, res);
    }),
  );

  router.post(
    '/:tutorId/admin/reject',
    requireAuth,
    requireRole('admin'),
    adminTutorActionLimiter,
    validate(TutorIdParamsSchema, 'params'),
    validate(RejectTutorSchema),
    wrap(async (req, res) => {
      await controller.reject(req as any, res);
    }),
  );

  return router;
};