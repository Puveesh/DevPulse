import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatDurationHM,
  formatDurationHoursMinutes,
  formatDurationWords,
  calculateWorkingSeconds,
} from '../lib/utils';
import { getUserTimezone } from '../hooks/useAnalytics';
import { groupTimelineByMonthsAndWeeks } from '../features/analytics/ConsistencySection';
import type { DailyActivity } from '../types';

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

  describe('Developer Analytics Dashboard Calculations', () => {
    it('calculates project task completion percentage with zero division guard and cancelled exclusion', () => {
      const calcProgress = (completed: number, total: number, cancelled: number) => {
        const eligible = total - cancelled;
        return eligible > 0 ? Math.round((completed * 100.0 / eligible) * 10.0) / 10.0 : 0.0;
      };

      // 4 completed, 10 total, 2 cancelled -> 4 / 8 = 50%
      expect(calcProgress(4, 10, 2)).toBe(50.0);

      // 0 total tasks -> 0%
      expect(calcProgress(0, 0, 0)).toBe(0.0);

      // all tasks cancelled -> 0 eligible -> 0%
      expect(calcProgress(0, 3, 3)).toBe(0.0);

      // 3 completed, 3 total, 0 cancelled -> 100%
      expect(calcProgress(3, 3, 0)).toBe(100.0);
    });

    it('calculates current streak considering today or yesterday start', () => {
      const computeCurrentStreak = (activeDates: Set<string>, todayStr: string) => {
        let streak = 0;
        const d = new Date(todayStr + 'T00:00:00Z');

        // Check if today is active
        if (activeDates.has(todayStr)) {
          let curr = new Date(d);
          while (activeDates.has(curr.toISOString().split('T')[0])) {
            streak++;
            curr.setUTCDate(curr.getUTCDate() - 1);
          }
        } else {
          // Check if yesterday was active
          const yesterday = new Date(d);
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (activeDates.has(yesterdayStr)) {
            let curr = new Date(yesterday);
            while (activeDates.has(curr.toISOString().split('T')[0])) {
              streak++;
              curr.setUTCDate(curr.getUTCDate() - 1);
            }
          }
        }
        return streak;
      };

      const today = '2026-11-13';
      const datesWithToday = new Set(['2026-11-13', '2026-11-12', '2026-11-11']);
      expect(computeCurrentStreak(datesWithToday, today)).toBe(3);

      // Not coded today yet, but coded yesterday and day before -> streak is 2
      const datesWithoutToday = new Set(['2026-11-12', '2026-11-11']);
      expect(computeCurrentStreak(datesWithoutToday, today)).toBe(2);

      // Neither today nor yesterday -> streak 0
      const datesOld = new Set(['2026-11-10', '2026-11-09']);
      expect(computeCurrentStreak(datesOld, today)).toBe(0);
    });

    it('evaluates heatmap contribution intensity levels accurately', () => {
      const getIntensityLevel = (seconds: number) => {
        if (seconds === 0) return 0;
        const hours = seconds / 3600;
        if (hours < 1) return 1;
        if (hours < 2) return 2;
        if (hours < 4) return 3;
        return 4;
      };

      expect(getIntensityLevel(0)).toBe(0); // 0s
      expect(getIntensityLevel(1800)).toBe(1); // 30m
      expect(getIntensityLevel(5400)).toBe(2); // 1.5h
      expect(getIntensityLevel(10800)).toBe(3); // 3h
      expect(getIntensityLevel(18000)).toBe(4); // 5h
    });

    it('determines the most productive time-of-day slot', () => {
      const resolveSlot = (morning: number, afternoon: number, evening: number, night: number) => {
        const max = Math.max(morning, Math.max(afternoon, Math.max(evening, night)));
        if (max === 0) return 'No Activity Recorded';
        if (max === morning) return 'Morning (06:00 - 12:00)';
        if (max === afternoon) return 'Afternoon (12:00 - 18:00)';
        if (max === evening) return 'Evening (18:00 - 00:00)';
        return 'Night (00:00 - 06:00)';
      };

      expect(resolveSlot(3600, 7200, 1800, 0)).toBe('Afternoon (12:00 - 18:00)');
      expect(resolveSlot(10800, 7200, 1800, 0)).toBe('Morning (06:00 - 12:00)');
      expect(resolveSlot(0, 0, 7200, 1800)).toBe('Evening (18:00 - 00:00)');
      expect(resolveSlot(0, 0, 0, 0)).toBe('No Activity Recorded');
    });

    describe('Monthly Contribution Heatmap Grouping (GitHub / LeetCode style)', () => {
      it('returns empty array when given empty or null timeline', () => {
        expect(groupTimelineByMonthsAndWeeks([])).toEqual([]);
        expect(groupTimelineByMonthsAndWeeks(null as any)).toEqual([]);
      });

      it('groups consecutive days across month boundaries into distinct month blocks', () => {
        // Oct 30 (Fri), Oct 31 (Sat), Nov 1 (Sun), Nov 2 (Mon)
        // 2026-10-30 is Friday (dayOfWeek = 4)
        // 2026-10-31 is Saturday (dayOfWeek = 5)
        // 2026-11-01 is Sunday (dayOfWeek = 6)
        // 2026-11-02 is Monday (dayOfWeek = 0)
        const mockTimeline: DailyActivity[] = [
          { date: '2026-10-30', day: 'Friday', durationSeconds: 3600, projects: [] },
          { date: '2026-10-31', day: 'Saturday', durationSeconds: 7200, projects: [] },
          { date: '2026-11-01', day: 'Sunday', durationSeconds: 1800, projects: [] },
          { date: '2026-11-02', day: 'Monday', durationSeconds: 5400, projects: [] },
        ];

        const monthGroups = groupTimelineByMonthsAndWeeks(mockTimeline);
        expect(monthGroups.length).toBe(2);

        // Check October group
        expect(monthGroups[0].monthKey).toBe('2026-10');
        expect(monthGroups[0].monthLabel).toBe('Oct');
        expect(monthGroups[0].weeks.length).toBe(1);
        expect(monthGroups[0].weeks[0].length).toBe(7);
        // Friday index is 4, Saturday index is 5
        expect(monthGroups[0].weeks[0][4]?.date).toBe('2026-10-30');
        expect(monthGroups[0].weeks[0][5]?.date).toBe('2026-10-31');
        expect(monthGroups[0].weeks[0][0]).toBeNull(); // Monday slot is empty
        expect(monthGroups[0].weeks[0][6]).toBeNull(); // Sunday slot is empty

        // Check November group
        expect(monthGroups[1].monthKey).toBe('2026-11');
        expect(monthGroups[1].monthLabel).toBe('Nov');
        // Nov 1 is Sunday (index 6). Nov 2 is Monday (index 0).
        // Since dayOfWeek wraps (6 -> 0), it should start a new week column
        expect(monthGroups[1].weeks.length).toBe(2);
        expect(monthGroups[1].weeks[0][6]?.date).toBe('2026-11-01');
        expect(monthGroups[1].weeks[1][0]?.date).toBe('2026-11-02');
      });

      it('aligns weekdays to 7-slot Monday-to-Sunday columns correctly', () => {
        // Monday 2026-11-09 to Sunday 2026-11-15 (full 7-day week)
        const fullWeek: DailyActivity[] = [
          { date: '2026-11-09', day: 'Monday', durationSeconds: 1000, projects: [] },
          { date: '2026-11-10', day: 'Tuesday', durationSeconds: 2000, projects: [] },
          { date: '2026-11-11', day: 'Wednesday', durationSeconds: 3000, projects: [] },
          { date: '2026-11-12', day: 'Thursday', durationSeconds: 4000, projects: [] },
          { date: '2026-11-13', day: 'Friday', durationSeconds: 5000, projects: [] },
          { date: '2026-11-14', day: 'Saturday', durationSeconds: 6000, projects: [] },
          { date: '2026-11-15', day: 'Sunday', durationSeconds: 7000, projects: [] },
        ];

        const monthGroups = groupTimelineByMonthsAndWeeks(fullWeek);
        expect(monthGroups.length).toBe(1);
        expect(monthGroups[0].weeks.length).toBe(1);

        const week = monthGroups[0].weeks[0];
        expect(week[0]?.day).toBe('Monday');
        expect(week[1]?.day).toBe('Tuesday');
        expect(week[2]?.day).toBe('Wednesday');
        expect(week[3]?.day).toBe('Thursday');
        expect(week[4]?.day).toBe('Friday');
        expect(week[5]?.day).toBe('Saturday');
        expect(week[6]?.day).toBe('Sunday');
      });
    });
  });
});

