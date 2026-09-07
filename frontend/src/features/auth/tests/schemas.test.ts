import { describe, expect, it } from 'vitest';
import { registerSchema } from '../schemas';

const basePayload = {
  name: 'Anna',
  surname: 'Schmidt',
  email: 'anna@example.com',
  timezone: 'Europe/Berlin',
  languageCode: 'de' as const,
};

describe('registerSchema', () => {
  it('accepts a strong, matching password', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'Xk9#mQ2vLp7$wZnR',
      confirmPassword: 'Xk9#mQ2vLp7$wZnR',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 15 characters', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'Short1!aZ',
      confirmPassword: 'Short1!aZ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 64 characters', () => {
    const longPassword = 'Aa1!'.repeat(17); // 68 chars
    const result = registerSchema.safeParse({
      ...basePayload,
      password: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an easily guessable password even when long enough', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'passwordpassword',
      confirmPassword: 'passwordpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched password confirmation', () => {
    const result = registerSchema.safeParse({
      ...basePayload,
      password: 'Xk9#mQ2vLp7$wZnR',
      confirmPassword: 'Different1234567!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('confirmPassword'))).toBe(true);
    }
  });
});
