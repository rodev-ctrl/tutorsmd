import { Router } from 'express';
import { ILessonController }   from '../controllers/lesson/ILessonController';
import { requireAuth }         from '../middlewares/auth/requireAuth';
import { requireRole }         from '../middlewares/auth/requireRole';
import { validate }            from '../middlewares/validate';
import {
  CreateTrialLessonSchema,
  CreateRegularScheduleSchema,
  CancelLessonSchema,
  ProposeRescheduleSchema,
  RescheduleByClientSchema,
  StartLessonSchema,
  UploadMaterialSchema,
  LessonIdParamsSchema,
  ScheduleIdParamsSchema,
  MaterialIdParamsSchema,
} from '../controllers/lesson/lesson.schema';
import {
  lessonActionLimiter,
  lessonStartLimiter,
  lessonMaterialLimiter,
} from '../middlewares/rateLimiter';

export const createLessonRouter = (controller: ILessonController): Router => {
  const router = Router();

  // ─── Trial ────────────────────────────────────────────────────
  router.post(
    '/trial',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(CreateTrialLessonSchema),
    (req, res) => controller.createTrial(req as any, res),
  );

  // ─── Regular schedule ─────────────────────────────────────────
  router.post(
    '/regular',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(CreateRegularScheduleSchema),
    (req, res) => controller.createRegularSchedule(req as any, res),
  );

  router.delete(
    '/regular/:scheduleId',
    requireAuth,
    lessonActionLimiter,
    validate(ScheduleIdParamsSchema, 'params'),
    (req, res) => controller.cancelRegularSchedule(req as any, res),
  );

  // ─── Get lesson ───────────────────────────────────────────────
  router.get(
    '/:lessonId',
    requireAuth,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.getLesson(req as any, res),
  );

  // ─── Tutor actions ────────────────────────────────────────────
  router.post(
    '/:lessonId/confirm',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.confirm(req as any, res),
  );

  router.post(
    '/:lessonId/reject',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.reject(req as any, res),
  );

  router.post(
    '/:lessonId/start',
    requireAuth,
    requireRole('tutor'),
    lessonStartLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(StartLessonSchema),
    (req, res) => controller.start(req as any, res),
  );

  router.post(
    '/:lessonId/complete',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.complete(req as any, res),
  );

  // ─── Cancel ───────────────────────────────────────────────────
  router.post(
    '/:lessonId/cancel/client',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    (req, res) => controller.cancelByClient(req as any, res),
  );

  router.post(
    '/:lessonId/cancel/tutor',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    (req, res) => controller.cancelByTutor(req as any, res),
  );

  router.post(
    '/:lessonId/cancel/single',
    requireAuth,
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    (req, res) => controller.cancelSingleLesson(req as any, res),
  );

  // ─── Reschedule ───────────────────────────────────────────────
  router.post(
    '/:lessonId/reschedule/propose',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(ProposeRescheduleSchema),
    (req, res) => controller.proposeReschedule(req as any, res),
  );

  router.post(
    '/:lessonId/reschedule/accept',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.acceptReschedule(req as any, res),
  );

  router.post(
    '/:lessonId/reschedule/decline',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.declineReschedule(req as any, res),
  );

  router.post(
    '/:lessonId/reschedule/client',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(RescheduleByClientSchema),
    (req, res) => controller.rescheduleByClient(req as any, res),
  );

  // ─── No-show ──────────────────────────────────────────────────
  router.post(
    '/:lessonId/no-show/client',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.markNoShowClient(req as any, res),
  );

  router.post(
    '/:lessonId/no-show/tutor',
    requireAuth,
    requireRole('admin'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.markNoShowTutor(req as any, res),
  );

  // ─── Materials ────────────────────────────────────────────────
  router.post(
    '/:lessonId/materials',
    requireAuth,
    lessonMaterialLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(UploadMaterialSchema),
    (req, res) => controller.uploadMaterial(req as any, res),
  );

  router.get(
    '/:lessonId/materials',
    requireAuth,
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.getMaterials(req as any, res),
  );

  router.delete(
    '/:lessonId/materials/:materialId',
    requireAuth,
    lessonMaterialLimiter,
    validate(MaterialIdParamsSchema, 'params'),
    (req, res) => controller.deleteMaterial(req as any, res),
  );

  return router;
};