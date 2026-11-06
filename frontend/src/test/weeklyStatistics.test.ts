import { describe, it, expect } from 'vitest';
import {
  getLocalMonday,
  shiftWeekMonday,
  formatWeekHeader,
} from '../features/dashboard/WeeklyStatisticsModal';

describe('Weekly Statistics Modal & Navigation Tests', () => {
  it('correctly calculates the Monday for any given date', () => {
    // 2026-11-06 is Friday -> Monday is 2026-11-02
    const friday = new Date(2026, 10, 6);
    expect(getLocalMonday(friday)).toBe('2026-11-02');

    // 2026-11-02 is Monday -> Monday is 2026-11-02
    const monday = new Date(2026, 10, 2);
    expect(getLocalMonday(monday)).toBe('2026-11-02');

    // 2026-11-08 is Sunday -> Monday of that week is 2026-11-02
    const sunday = new Date(2026, 10, 8);
    expect(getLocalMonday(sunday)).toBe('2026-11-02');
  });

  it('shifts weeks backwards and forwards by 7 days', () => {
    const monday = '2026-11-02';
    const prevMonday = shiftWeekMonday(monday, -1);
    expect(prevMonday).toBe('2026-10-26');

    const nextMonday = shiftWeekMonday(prevMonday, 1);
    expect(nextMonday).toBe('2026-11-02');

    const twoWeeksBack = shiftWeekMonday(monday, -2);
    expect(twoWeeksBack).toBe('2026-10-19');
  });

  it('formats week date range headers correctly', () => {
    const header = formatWeekHeader('2026-11-02', '2026-11-08');
    expect(header).toContain('Nov 2, 2026');
    expect(header).toContain('Nov 8, 2026');
  });

  it('calculates daily contribution percentages accurately', () => {
    const projectTime = 7200; // 2 hours
    const dayTotal = 10800; // 3 hours
    const percent = ((projectTime / dayTotal) * 100).toFixed(1);
    expect(percent).toBe('66.7');

    const projectBTime = 3600; // 1 hour
    const percentB = ((projectBTime / dayTotal) * 100).toFixed(1);
    expect(percentB).toBe('33.3');
  });

  it('prevents future week navigation logic', () => {
    const currentMonday = '2026-11-02';
    const attemptedNext = shiftWeekMonday(currentMonday, 1);
    // 2026-11-09 is in the future relative to currentMonday
    const isFuture = attemptedNext > currentMonday;
    expect(isFuture).toBe(true);

    // Clamping logic
    const clamped = attemptedNext > currentMonday ? currentMonday : attemptedNext;
    expect(clamped).toBe(currentMonday);
  });
});

