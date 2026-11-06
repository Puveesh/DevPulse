import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatDurationHM,
  formatDurationHoursMinutes,
  formatDurationWords,
  calculateWorkingSeconds,
} from '../lib/utils';
import { getUserTimezone } from '../hooks/useAnalytics';

describe('Analytics Utility & Calculation Tests', () => {
  it('correctly formats hours, minutes, and seconds into standard formats', () => {
    // 3 hours, 45 minutes, 20 seconds = 13520 seconds
    const seconds = 3 * 3600 + 45 * 60 + 20;

    expect(formatDuration(seconds)).toBe('03:45:20');
    expect(formatDurationHM(seconds)).toBe('03:45');
    expect(formatDurationHoursMinutes(seconds)).toBe('3h 45m');
    expect(formatDurationWords(seconds)).toBe('3 hours 45 mins');
  });

  it('handles zero and edge durations cleanly', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDurationHoursMinutes(0)).toBe('0h 00m');
    expect(formatDurationWords(0)).toBe('0 mins');

    // Negative duration should fallback safely
    expect(formatDuration(-100)).toBe('00:00:00');
    expect(formatDurationHoursMinutes(-100)).toBe('0h 00m');
    expect(formatDurationWords(-100)).toBe('0 mins');
  });

  it('formats single hour or minute correctly in words', () => {
    expect(formatDurationWords(3600)).toBe('1 hour');
    expect(formatDurationWords(7200)).toBe('2 hours');
    expect(formatDurationWords(60)).toBe('1 min');
    expect(formatDurationWords(120)).toBe('2 mins');
  });

  it('detects browser local timezone or fallbacks to UTC', () => {
    const tz = getUserTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('calculates working seconds excluding pause intervals accurately', () => {
    const start = '2026-11-06T10:00:00Z';
    const end = '2026-11-06T12:00:00Z'; // 2 hours = 7200s
    const pauseIntervals = [
      {
        pausedAt: '2026-11-06T10:30:00Z',
        resumedAt: '2026-11-06T11:00:00Z', // 30 minutes paused = 1800s
      },
    ];

    const workingSecs = calculateWorkingSeconds(start, end, pauseIntervals);
    expect(workingSecs).toBe(5400); // 7200 - 1800 = 5400s (1h 30m)
  });

  it('computes real-time dynamic ticking delta for active session', () => {
    const backendTodayWorking = 1200; // 20m confirmed by backend at fetch time
    const clientElapsedSeconds = 1265; // Client timer ticked to 21m 5s

    const liveActiveExtra = Math.max(0, clientElapsedSeconds - backendTodayWorking);
    expect(liveActiveExtra).toBe(65);

    const baseTodayTotal = 3600; // 1h
    const liveTodayTotal = baseTodayTotal + liveActiveExtra;
    expect(liveTodayTotal).toBe(3665);
    expect(formatDuration(liveTodayTotal)).toBe('01:01:05');
  });
});
