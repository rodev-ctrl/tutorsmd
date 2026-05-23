import { z } from 'zod';

// tutorId берётся из JWT в контроллере
export const CreateAvailableSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
});

// DeleteAvailableSlotUseCase: dto.slotId (route param), dto.tutorId (JWT)
export const DeleteAvailableSlotParamsSchema = z.object({
  slotId: z.string().uuid(),
});

export const TutorIdParamsSchema = z.object({
  tutorId: z.string().uuid(),
});

export type CreateAvailableSlotBody = z.infer<typeof CreateAvailableSlotSchema>;
export type DeleteAvailableSlotParams = z.infer<typeof DeleteAvailableSlotParamsSchema>;
export type TutorIdParams = z.infer<typeof TutorIdParamsSchema>;