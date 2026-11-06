import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../features/auth/schemas';

describe('Authentication Form Validation Schemas', () => {
  describe('Login Validation', () => {
    it('should validate valid email and password', () => {
      const valid = { email: 'dev@devpulse.io', password: 'ValidPassword123' };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalid = { email: 'invalid-email', password: 'ValidPassword123' };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('should reject empty password', () => {
      const invalid = { email: 'dev@devpulse.io', password: '' };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password is required');
      }
    });
  });

  describe('Registration Validation', () => {
    it('should validate complete valid registration data', () => {
      const valid = {
        displayName: 'Dev Pulse',
        email: 'developer@devpulse.io',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject password with less than 8 characters', () => {
      const invalid = {
        displayName: 'Dev Pulse',
        email: 'developer@devpulse.io',
        password: 'short',
        confirmPassword: 'short',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject mismatched passwords', () => {
      const invalid = {
        displayName: 'Dev Pulse',
        email: 'developer@devpulse.io',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === 'Passwords do not match')).toBe(true);
      }
    });

    it('should reject short display names', () => {
      const invalid = {
        displayName: 'A',
        email: 'developer@devpulse.io',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });
  });
});

