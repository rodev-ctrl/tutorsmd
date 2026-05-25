import { z } from 'zod';

export const schema = z.object({
  name:         z.string().min(2).max(100).trim(),
  surname:      z.string().min(2).max(100).trim(),
  username:     z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional().or(z.literal('')),
  timezone:     z.string().optional(),
  languageCode: z.enum(['en', 'de', 'ru']),
});

export type FormData = z.infer<typeof schema>;