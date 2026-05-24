import { Router } from 'express';
import { ITutorController } from '../controllers/tutor/ITutorController';
import { requireAuth } from '../middlewares/auth/requireAuth';
import { requireRole } from '../middlewares/auth/requireRole';
import { validate } from '../middlewares/validate';
import { UpdateTutorProfileSchema, RejectTutorSchema } from '../controllers/tutor/tutor.schema';

export const createTutorRouter = (controller: ITutorController): Router => {
  const router = Router();

  // GET /tutor/profile — только тьютор
  router.get(
    '/profile',
    requireAuth,
    requireRole('tutor'),
    (req, res) => controller.getProfile(req, res),
  );

  // PUT /tutor/profile — только тьютор
  router.put(
    '/profile',
    requireAuth,
    requireRole('tutor'),
    validate(UpdateTutorProfileSchema),
    (req, res) => controller.updateProfile(req, res),
  );

  /*
  // GET /tutor/pending — только admin
  router.get(
    '/pending',
    requireAuth,
    requireRole('admin'),
    (req, res) => controller.getPending(req, res),
  );
*/

  // POST /tutor/:tutorId/approve — только admin
  router.post(
    '/:tutorId/approve',
    requireAuth,
    requireRole('admin'),
    (req, res) => controller.approve(req, res),
  );

  // POST /tutor/:tutorId/reject — только admin
  router.post(
    '/:tutorId/reject',
    requireAuth,
    requireRole('admin'),
    validate(RejectTutorSchema),
    (req, res) => controller.reject(req, res),
  );

  return router;
};