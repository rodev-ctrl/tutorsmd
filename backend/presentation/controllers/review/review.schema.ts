import { z } from 'zod';

export const SubmitReviewSchema = z.object({
  lessonId: z.string().uuid(),
  rating:   z.number().int().min(1).max(5),
  comment:  z.string().max(2000).optional(),
});

export const GetTutorReviewsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),

  before: z
    .string()
    .datetime()
    .optional(),
});

export type SubmitReviewBody = z.infer<typeof SubmitReviewSchema>;
export type GetTutorReviewsQueryDto = z.infer<typeof GetTutorReviewsQuerySchema>;