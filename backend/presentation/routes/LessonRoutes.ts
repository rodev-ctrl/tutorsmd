import { Router } from 'express';
import { ILessonController }   from '../controllers/lesson/ILessonController';
import { requireAuth }         from '../middlewares/auth/requireAuth';
import { requireRole }         from '../middlewares/auth/requireRole';
import { validate }            from '../middlewares/validate';
import { wrap } from './wrapper';
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
  LessonIdParams,
  ScheduleIdParams,
  MaterialIdParams,
} from '../controllers/lesson/lesson.schema';
import {
  lessonActionLimiter,
  lessonStartLimiter,
  lessonMaterialLimiter,
} from '../middlewares/rateLimiter';

export const createLessonRouter = (controller: ILessonController): Router => {
  const router = Router();

  // --- Trial ----------------------------------------------------------
  router.post(
    '/trial',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(CreateTrialLessonSchema),
    wrap((req, res) => controller.createTrial(req, res)),
  );

  // --- Regular schedule --------------------------------------------------
  router.post(
    '/regular',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(CreateRegularScheduleSchema),
    wrap((req, res) => controller.createRegularSchedule(req, res)),
  );

  router.delete(
    '/regular/:scheduleId',
    requireAuth,
    lessonActionLimiter,
    validate(ScheduleIdParamsSchema, 'params'),
    wrap<ScheduleIdParams>((req, res) => controller.cancelRegularSchedule(req, res)),
  );

  // GET /lessons - список уроков текущего пользователя
  router.get(
    '/',
    requireAuth,
    wrap((req, res) => controller.getUserLessons(req, res)),
  );

  // --- Get lesson -------------------------------------------------
  router.get(
    '/:lessonId',
    requireAuth,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.getLesson(req, res)),
  );

  // --- Tutor actions ----------------------------------------------------
  router.post(
    '/:lessonId/confirm',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.confirm(req, res)),
  );

  router.post(
    '/:lessonId/reject',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.reject(req, res)),
  );

  router.post(
    '/:lessonId/start',
    requireAuth,
    requireRole('tutor'),
    lessonStartLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(StartLessonSchema),
    wrap<LessonIdParams, {}, { roomId: string }>((req, res) => controller.start(req, res)),
  );

  router.post(
    '/:lessonId/complete',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.complete(req, res)),
  );



  router.post(
    '/:lessonId/cancel/client',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    wrap<LessonIdParams, {}, { reason?: string }>((req, res) => controller.cancelByClient(req, res)),
  );

  router.post(
    '/:lessonId/cancel/tutor',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    wrap<LessonIdParams, {}, { reason?: string }>((req, res) => controller.cancelByTutor(req, res)),
  );

  router.post(
    '/:lessonId/cancel/single',
    requireAuth,
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(CancelLessonSchema),
    wrap<LessonIdParams, {}, { reason?: string }>((req, res) => controller.cancelSingleLesson(req, res)),
  );

  // --- Reschedule ---------------------------------------------------------
  router.post(
    '/:lessonId/reschedule/propose',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(ProposeRescheduleSchema),
    wrap<LessonIdParams, {}, { newScheduledAt: string }>((req, res) => controller.proposeReschedule(req, res)),
  );

  router.post(
    '/:lessonId/reschedule/accept',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.acceptReschedule(req, res)),
  );

  router.post(
    '/:lessonId/reschedule/decline',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.declineReschedule(req, res)),
  );

  router.post(
    '/:lessonId/reschedule/client',
    requireAuth,
    requireRole('client'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(RescheduleByClientSchema),
    wrap<LessonIdParams, {}, { newScheduledAt: string; durationMinutes?: number }>((req, res) => controller.rescheduleByClient(req, res)),
  );

  // --- No-show ----------------------------------------------------
  router.post(
    '/:lessonId/no-show/client',
    requireAuth,
    requireRole('tutor'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.markNoShowClient(req, res)),
  );

  router.post(
    '/:lessonId/no-show/tutor',
    requireAuth,
    requireRole('admin'),
    lessonActionLimiter,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.markNoShowTutor(req, res)),
  );

  // --- Materials ----------------------------------------------------
  router.post(
    '/:lessonId/materials',
    requireAuth,
    lessonMaterialLimiter,
    validate(LessonIdParamsSchema, 'params'),
    validate(UploadMaterialSchema),
    wrap<LessonIdParams, {}, { materialType: 'homework' | 'homework_done' | 'lesson_file' | 'other'; fileName: string; mimeType: string; fileSize: number }>((req, res) => controller.uploadMaterial(req, res)),
  );

  router.get(
    '/:lessonId/materials',
    requireAuth,
    validate(LessonIdParamsSchema, 'params'),
    wrap<LessonIdParams>((req, res) => controller.getMaterials(req, res)),
  );

  router.delete(
    '/:lessonId/materials/:materialId',
    requireAuth,
    lessonMaterialLimiter,
    validate(MaterialIdParamsSchema, 'params'),
    wrap<MaterialIdParams>((req, res) => controller.deleteMaterial(req, res)),
  );

  return router;
};