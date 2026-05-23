// presentation/routes/LessonRoutes.ts
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

export const createLessonRouter = (controller: ILessonController): Router => {
  const router = Router();

  // ─── Trial ────────────────────────────────────────────────────
  router.post(
    '/trial',
    requireAuth,
    requireRole('client'),
    validate(CreateTrialLessonSchema),
    (req, res) => controller.createTrial(req as any, res),
  );

  // ─── Regular schedule ─────────────────────────────────────────
  router.post(
    '/regular',
    requireAuth,
    requireRole('client'),
    validate(CreateRegularScheduleSchema),
    (req, res) => controller.createRegularSchedule(req as any, res),
  );

  router.delete(
    '/regular/:scheduleId',
    requireAuth,
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
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.confirm(req as any, res),
  );

  router.post(
    '/:lessonId/reject',
    requireAuth,
    requireRole('tutor'),
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.reject(req as any, res),
  );

  router.post(
    '/:lessonId/start',
    requireAuth,
    requireRole('tutor'),
    validate(LessonIdParamsSchema, 'params'),
    validate(StartLessonSchema),
    (req, res) => controller.start(req as any, res),
  );

  router.post(
    '/:lessonId/complete',
    requireAuth,
    requireRole('tutor'),
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.complete(req as any, res),
  );

  // ─── Cancel ───────────────────────────────────────────────────
  router.post(
    '/:lessonId/cancel/client',
    requireAuth,
    requireRole('client'),
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    (req, res) => controller.cancelByClient(req as any, res),
  );

  router.post(
    '/:lessonId/cancel/tutor',
    requireAuth,
    requireRole('tutor'),
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    (req, res) => controller.cancelByTutor(req as any, res),
  );

  // Отмена одного урока из серии
  router.post(
    '/:lessonId/cancel/single',
    requireAuth,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    (req, res) => controller.cancelSingleLesson(req as any, res),
  );

  // ─── Reschedule ───────────────────────────────────────────────
  // Тьютор предлагает перенос
  router.post(
    '/:lessonId/reschedule/propose',
    requireAuth,
    requireRole('tutor'),
    validate(LessonIdParamsSchema, 'params'),
    validate(ProposeRescheduleSchema),
    (req, res) => controller.proposeReschedule(req as any, res),
  );

  // Клиент принимает предложение тьютора
  router.post(
    '/:lessonId/reschedule/accept',
    requireAuth,
    requireRole('client'),
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.acceptReschedule(req as any, res),
  );

  // Клиент отклоняет предложение тьютора
  router.post(
    '/:lessonId/reschedule/decline',
    requireAuth,
    requireRole('client'),
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.declineReschedule(req as any, res),
  );

  // Клиент сам предлагает новое время
  router.post(
    '/:lessonId/reschedule/client',
    requireAuth,
    requireRole('client'),
    validate(LessonIdParamsSchema, 'params'),
    validate(RescheduleByClientSchema),
    (req, res) => controller.rescheduleByClient(req as any, res),
  );

  // ─── No-show ──────────────────────────────────────────────────
  // Тьютор отмечает что клиент не пришёл
  router.post(
    '/:lessonId/no-show/client',
    requireAuth,
    requireRole('tutor'),
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.markNoShowClient(req as any, res),
  );

  // Только admin может отметить что тьютор не пришёл
  router.post(
    '/:lessonId/no-show/tutor',
    requireAuth,
    requireRole('admin'),
    validate(LessonIdParamsSchema, 'params'),
    (req, res) => controller.markNoShowTutor(req as any, res),
  );

  // ─── Materials ────────────────────────────────────────────────
  router.post(
    '/:lessonId/materials',
    requireAuth,
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
    validate(MaterialIdParamsSchema, 'params'),
    (req, res) => controller.deleteMaterial(req as any, res),
  );

  return router;
};