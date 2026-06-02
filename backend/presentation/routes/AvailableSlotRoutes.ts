import { Router } from 'express';
import { IAvailableSlotController } from '../controllers/available-slot/IAvailableSlotController';
import { requireAuth } from '../middlewares/auth/requireAuth';
import { requireRole } from '../middlewares/auth/requireRole';
import { validate } from '../middlewares/validate';
import { CreateAvailableSlotSchema } from '../controllers/available-slot/available-slot.schema';
import { slotCreateLimiter, slotDeleteLimiter } from '../middlewares/rateLimiter';

export const createAvailableSlotRouter = (controller: IAvailableSlotController): Router => {
  const router = Router();

  // GET /slots/tutor/:tutorId — публичное расписание тьютора (без авторизации)
  router.get(
    '/tutor/:tutorId',
    (req, res) => controller.getPublicSlots(req, res),
  );

  // GET /slots/me — тьютор смотрит свои слоты (включая неактивные)
  router.get(
    '/me',
    requireAuth,
    requireRole('tutor'),
    (req, res) => controller.getOwnSlots(req, res),
  );

  // POST /slots — тьютор создаёт слот
  router.post(
    '/',
    requireAuth,
    requireRole('tutor'),
    slotCreateLimiter,
    validate(CreateAvailableSlotSchema),
    (req, res) => controller.createSlot(req, res),
  );

  // DELETE /slots/:slotId — тьютор удаляет слот
  router.delete(
    '/:slotId',
    requireAuth,
    requireRole('tutor'),
    slotDeleteLimiter,
    (req, res) => controller.deleteSlot(req, res),
  );

  return router;
};