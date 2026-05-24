import { z } from 'zod';

export const UpdateUserProfileSchema = z.object({
  name:         z.string().min(2).max(100).trim().optional(),
  surname:      z.string().min(2).max(100).trim().optional(),
  username:     z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  timezone:     z.string().optional(),
  languageCode: z.enum(['en', 'de', 'ru']).optional(),
  avatarUrl:    z.string().url().nullable().optional(),
});

export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileSchema>;