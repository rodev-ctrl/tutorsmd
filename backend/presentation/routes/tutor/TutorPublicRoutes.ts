import { Router } from 'express';
import { ITutorPublicController } from '../../controllers/tutor/public/ITutorPublicController';
import { validate } from '../../middlewares/validate';
import { publicYesCache } from '../../middlewares/cacheControl';
import { wrap } from '../wrapper';
import {
  TutorListQuerySchema,
  TutorIdParamsSchema,
} from '../../controllers/tutor/public/tutor-public.schema';

export const createTutorPublicRouter = (
  controller: ITutorPublicController
): Router => {
  const router = Router();

  router.get(
    '/',
    publicYesCache(60),
    validate(TutorListQuerySchema, 'query'),
    wrap(async (req, res) => {
      await controller.getPublicList(req as any, res);
    }),
  );

  router.get(
    '/:tutorId',
    publicYesCache(60),
    validate(TutorIdParamsSchema, 'params'),
    wrap(async (req, res) => {
      await controller.getPublicProfile(req as any, res);
    }),
  );

  return router;
};