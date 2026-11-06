import { describe, it, expect } from 'vitest';
import { formatDuration, formatDurationHM, calculateWorkingSeconds } from '../lib/utils';
import { z } from 'zod';

const startSessionSchema = z.object({
  projectId: z.string().uuid('Project selection is mandatory'),
  title: z.string().min(1, 'Session title is required').max(255),
  initialNotes: z.string().optional().nullable(),
});

describe('Work Session Timer Utilities', () => {
  it('formats seconds into HH:MM:SS correctly', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(45)).toBe('00:00:45');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3600)).toBe('01:00:00');
    expect(formatDuration(3665)).toBe('01:01:05');
  });

  it('formats seconds into HH:MM correctly', () => {
    expect(formatDurationHM(0)).toBe('00:00');
    expect(formatDurationHM(3600)).toBe('01:00');
    expect(formatDurationHM(5400)).toBe('01:30');
  });

  it('calculates working seconds excluding pause intervals', () => {
    const baseTime = 1700000000000;
    const startedAt = new Date(baseTime).toISOString();
    // 30 min total, paused from min 10 to 15 (5 min = 300s paused)
    const pauseIntervals = [
      {
        pausedAt: new Date(baseTime + 10 * 60 * 1000).toISOString(),
        resumedAt: new Date(baseTime + 15 * 60 * 1000).toISOString(),
      },
    ];
    const endedAt = new Date(baseTime + 30 * 60 * 1000).toISOString();

    const workingSeconds = calculateWorkingSeconds(startedAt, endedAt, pauseIntervals);
    // 30 min (1800s) - 5 min pause (300s) = 25 min (1500s)
    expect(workingSeconds).toBe(1500);
  });

  it('calculates working seconds when session is currently paused', () => {
    const baseTime = 1700000000000;
    const startedAt = new Date(baseTime).toISOString();
    // Paused at min 10 (not resumed)
    const pauseIntervals = [
      {
        pausedAt: new Date(baseTime + 10 * 60 * 1000).toISOString(),
        resumedAt: null,
      },
    ];
    // Current time is min 25
    const asOf = baseTime + 25 * 60 * 1000;

    const workingSeconds = calculateWorkingSeconds(startedAt, null, pauseIntervals, asOf);
    // Should be capped at 10 min (600s), not advancing past pause time
    expect(workingSeconds).toBe(600);
  });

  it('requires mandatory project ID in start session schema', () => {
    const valid = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Fix auth filter',
      initialNotes: 'Starting work',
    };
    expect(startSessionSchema.safeParse(valid).success).toBe(true);

    const missingProject = {
      title: 'No project selected',
    };
    expect(startSessionSchema.safeParse(missingProject).success).toBe(false);

    const emptyProject = {
      projectId: '',
      title: 'Empty project string',
    };
    expect(startSessionSchema.safeParse(emptyProject).success).toBe(false);
  });
});
