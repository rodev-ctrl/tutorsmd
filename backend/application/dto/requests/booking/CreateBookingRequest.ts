import { z } from 'zod';

export const CreateBookingRequestSchema = z.object({
  userid: z.number().positive(),
  tutorEmail: z.string().email(),
  dateTime: z.string().datetime()
});

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;