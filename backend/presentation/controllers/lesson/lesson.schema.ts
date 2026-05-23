// presentation/controllers/lesson/lesson.schema.ts
import { z } from 'zod';

export const CreateTrialLessonSchema = z.object({
  tutorId:         z.string().uuid(),
  subjectId:       z.string().uuid(),
  scheduledAt:     z.string().datetime(),
  durationMinutes: z.number().int().min(30).max(180).optional(),
});

// Regular schedule требует dayOfWeek + timeOfDay + firstLessonAt
export const CreateRegularScheduleSchema = z.object({
  tutorId:         z.string().uuid(),
  subjectId:       z.string().uuid(),
  dayOfWeek:       z.number().int().min(0).max(6),
  timeOfDay:       z.string().datetime(),
  firstLessonAt:   z.string().datetime(),
  durationMinutes: z.number().int().min(30).max(180).optional(),
});

export const CancelLessonSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const ProposeRescheduleSchema = z.object({
  newScheduledAt: z.string().datetime(),
  // expiresAt убран — PROPOSAL_EXPIRES_HOURS = 48 в use case
});

export const RescheduleByClientSchema = z.object({
  newScheduledAt:  z.string().datetime(),
  durationMinutes: z.number().int().min(30).max(180).optional(),
});

export const StartLessonSchema = z.object({
  roomId: z.string().min(1).max(255),
});

export const UploadMaterialSchema = z.object({
  materialType: z.enum(['homework', 'homework_done', 'lesson_file', 'other']),
  fileName:     z.string().min(1).max(255),
  mimeType:     z.string().min(1).max(100),
  fileSize:     z.number().int().positive(),
});

// ─── Params ───────────────────────────────────────────────────

export const LessonIdParamsSchema = z.object({
  lessonId: z.string().uuid(),
});

export const ScheduleIdParamsSchema = z.object({
  scheduleId: z.string().uuid(),
});

export const MaterialIdParamsSchema = z.object({
  materialId: z.string().uuid(),
});

// ─── Types ────────────────────────────────────────────────────

export type CreateTrialLessonBody     = z.infer<typeof CreateTrialLessonSchema>;
export type CreateRegularScheduleBody = z.infer<typeof CreateRegularScheduleSchema>;
export type CancelLessonBody          = z.infer<typeof CancelLessonSchema>;
export type ProposeRescheduleBody     = z.infer<typeof ProposeRescheduleSchema>;
export type RescheduleByClientBody    = z.infer<typeof RescheduleByClientSchema>;
export type StartLessonBody           = z.infer<typeof StartLessonSchema>;
export type UploadMaterialBody        = z.infer<typeof UploadMaterialSchema>;
export type LessonIdParams            = z.infer<typeof LessonIdParamsSchema>;
export type ScheduleIdParams          = z.infer<typeof ScheduleIdParamsSchema>;
export type MaterialIdParams          = z.infer<typeof MaterialIdParamsSchema>;