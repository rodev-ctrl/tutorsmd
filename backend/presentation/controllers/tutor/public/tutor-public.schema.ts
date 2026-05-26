import { z } from 'zod';

export const TutorListQuerySchema = z.object({
  search:  z.string().max(100).optional(),
  minRate: z.coerce.number().positive().optional(),
  maxRate: z.coerce.number().positive().optional(),
  page:    z.coerce.number().int().min(1).default(1),
  limit:   z.coerce.number().int().min(1).max(50).default(12),
});

export const TutorIdParamsSchema = z.object({
  tutorId: z.string().uuid(),
});

export type TutorListQuery = z.infer<typeof TutorListQuerySchema>;
export type TutorIdParams  = z.infer<typeof TutorIdParamsSchema>;