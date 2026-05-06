// presentation/schemas/auth.schema.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  activeRole: z.enum(['client', 'tutor', 'admin']),
});