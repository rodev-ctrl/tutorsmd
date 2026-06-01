import { z } from 'zod';

export const loginSchema = z.object({
  email:      z.string().email('Ungültige E-Mail-Adresse'),
  password:   z.string().min(1, 'Passwort ist erforderlich'),
  activeRole: z.enum(['client', 'tutor', 'admin']),
});

export const registerSchema = z.object({
  name:     z.string().min(2, 'Name zu kurz').max(100),
  surname:  z.string().min(2, 'Nachname zu kurz').max(100),
  email:    z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(15, 'Mindestens 15 Zeichen')
    .max(64,  'Maximal 64 Zeichen'),
  confirmPassword: z.string(),
  timezone:     z.string().optional(),
  languageCode: z.enum(['en', 'de', 'ru']),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwörter stimmen nicht überein', path: ['confirmPassword'] },
);

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

export const resetPasswordSchema = z.object({
  newPassword:     z.string().min(15).max(64),
  confirmPassword: z.string(),
}).refine(
  (d) => d.newPassword === d.confirmPassword,
  { message: 'Passwörter stimmen nicht überein', path: ['confirmPassword'] },
);

export type LoginFormData         = z.infer<typeof loginSchema>;
export type RegisterFormData      = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData  = z.infer<typeof resetPasswordSchema>;