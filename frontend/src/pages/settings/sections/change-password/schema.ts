import { z } from 'zod';

export const schema = z.object({
  oldPassword: z.string().min(1, 'Erforderlich'),
  newPassword: z.string().min(15, 'Mindestens 15 Zeichen').max(64),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export type FormData = z.infer<typeof schema>;