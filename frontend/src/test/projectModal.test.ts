import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(150, 'Project name cannot exceed 150 characters'),
  description: z.string().optional(),
  repositoryUrl: z
    .string()
    .url('Please enter a valid URL')
    .max(500, 'Repository URL cannot exceed 500 characters')
    .or(z.literal(''))
    .optional(),
  techStack: z
    .string()
    .max(500, 'Tech stack cannot exceed 500 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
});

describe('Project Form Validation', () => {
  it('validates correct project input', () => {
    const valid = {
      name: 'DevPulse Core',
      description: 'Productivity suite',
      repositoryUrl: 'https://github.com/org/repo',
      techStack: 'React, TypeScript, Spring Boot',
      status: 'ACTIVE',
    };
    const result = projectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty project name', () => {
    const invalid = {
      name: '',
      status: 'ACTIVE',
    };
    const result = projectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Project name is required');
    }
  });

  it('rejects invalid repository URL', () => {
    const invalid = {
      name: 'Valid Name',
      repositoryUrl: 'not-a-valid-url',
      status: 'ACTIVE',
    };
    const result = projectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid URL');
    }
  });
});

