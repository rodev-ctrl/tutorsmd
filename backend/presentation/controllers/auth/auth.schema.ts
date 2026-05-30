import { z } from 'zod';

// ─── Registration ─────────────────────────────────────────────
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name too short').max(100, 'Name too long').trim(),
  surname: z.string().min(2, 'Surname too short').max(100, 'Surname too long').trim(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  timezone: z.string().optional(),
});

// ─── Activation ───────────────────────────────────────────────
export const ActivateAccountSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

// ─── Login ────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  activeRole: z.enum(['client', 'tutor', 'admin']),
  deviceInfo: z.string().max(255).optional(),
});

// ─── Switch Role ──────────────────────────────────────────────
export const SwitchRoleSchema = z.object({
  newRole: z.enum(['client', 'tutor', 'admin']),
});

// ─── Refresh Token ────────────────────────────────────────────
export const RefreshSchema = z.object({
  activeRole: z.enum(['client', 'tutor', 'admin']).optional(),
});

// ─── Password ─────────────────────────────────────────────────
export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

// ─── Email Change ─────────────────────────────────────────────
export const RequestEmailChangeSchema = z.object({
  newEmail: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Sessions ─────────────────────────────────────────────────
export const RevokeSessionSchema = z.object({
  tokenHash: z.string().min(1, 'Token hash is required'),
});



export type RegisterBody             = z.infer<typeof RegisterSchema>;
export type ResendVerificationBody   = z.infer<typeof ResendVerificationSchema>;
export type LoginBody                = z.infer<typeof LoginSchema>;
export type SwitchRoleBody           = z.infer<typeof SwitchRoleSchema>;
export type RefreshBody              = z.infer<typeof RefreshSchema>;
export type ChangePasswordBody       = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordBody       = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordBody        = z.infer<typeof ResetPasswordSchema>;
export type RequestEmailChangeBody   = z.infer<typeof RequestEmailChangeSchema>;
export type RevokeSessionParams      = z.infer<typeof RevokeSessionSchema>;
export type ActivateAccountParams    = z.infer<typeof ActivateAccountSchema>;
