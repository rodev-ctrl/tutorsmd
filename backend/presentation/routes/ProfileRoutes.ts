import { Router } from 'express';
import { IProfileController } from '../controllers/profile/IProfileController';
import { requireAuth } from '../middlewares/auth/requireAuth';
import { validate } from '../middlewares/validate';
import { UpdateUserProfileSchema } from '../controllers/profile/profile.schema';

export const createProfileRouter = (controller: IProfileController): Router => {
  const router = Router();

  // GET /profile/me
  router.get('/me', requireAuth, (req, res) => controller.getProfile(req, res));

  // PUT /profile/me
  router.put(
    '/me',
    requireAuth,
    validate(UpdateUserProfileSchema),
    (req, res) => controller.updateProfile(req, res),
  );

  return router;
};