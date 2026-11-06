import { describe, it, expect } from 'vitest';
import { formatDuration } from '../lib/utils';
import { z } from 'zod';

const startSessionSchema = z.object({
  projectId: z.string().uuid().optional().nullable().or(z.literal('')),
  title: z.string().min(1, 'Session title is required').max(255),
  notes: z.string().optional().nullable(),
});

describe('Work Session Timer Utilities', () => {
  it('formats seconds into HH:MM:SS correctly', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(45)).toBe('00:00:45');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3600)).toBe('01:00:00');
    expect(formatDuration(3665)).toBe('01:01:05');
    expect(formatDuration(86399)).toBe('23:59:59');
  });

  it('handles negative or invalid values gracefully', () => {
    expect(formatDuration(-10)).toBe('00:00:00');
    expect(formatDuration(NaN)).toBe('00:00:00');
  });

  it('validates start session schema', () => {
    const valid = {
      title: 'Fix issue #42',
      notes: 'Investigating null pointer',
      projectId: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(startSessionSchema.safeParse(valid).success).toBe(true);

    const emptyTitle = { title: '' };
    expect(startSessionSchema.safeParse(emptyTitle).success).toBe(false);
  });
});
