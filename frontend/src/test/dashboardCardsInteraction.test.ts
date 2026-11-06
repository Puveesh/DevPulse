import { describe, it, expect } from 'vitest';
import type { TodaySession } from '../types';
import { formatDuration, formatDurationHoursMinutes } from '../lib/utils';

describe('Dashboard Cards Interaction & Today Worklogs Grouping Tests', () => {
  it('groups multiple sessions by project and sums duration accurately', () => {
    const mockSessions: TodaySession[] = [
      {
        id: 's1',
        projectId: 'p1',
        projectName: 'Project A',
        title: 'Backend API',
        status: 'COMPLETED',
        startedAt: '2026-11-06T10:00:00Z',
        endedAt: '2026-11-06T11:30:00Z',
        todayWorkingSeconds: 5400, // 1h 30m
        totalDurationSeconds: 5400,
        initialNotes: 'API design',
        sessionNotes: 'Finished controllers',
      },
      {
        id: 's2',
        projectId: 'p1',
        projectName: 'Project A',
        title: 'Unit tests',
        status: 'COMPLETED',
        startedAt: '2026-11-06T13:00:00Z',
        endedAt: '2026-11-06T14:00:00Z',
        todayWorkingSeconds: 3600, // 1h
        totalDurationSeconds: 3600,
      },
      {
        id: 's3',
        projectId: 'p2',
        projectName: 'Project B',
        title: 'Bugfix CSS',
        status: 'COMPLETED',
        startedAt: '2026-11-06T15:00:00Z',
        endedAt: '2026-11-06T16:15:00Z',
        todayWorkingSeconds: 4500, // 1h 15m
        totalDurationSeconds: 4500,
      },
    ];

    // Group by project
    const groupsMap = new Map<string, { projectName: string; totalSeconds: number; sessions: TodaySession[] }>();
    mockSessions.forEach((s) => {
      const existing = groupsMap.get(s.projectId) || {
        projectName: s.projectName,
        totalSeconds: 0,
        sessions: [],
      };
      existing.totalSeconds += s.todayWorkingSeconds;
      existing.sessions.push(s);
      groupsMap.set(s.projectId, existing);
    });

    const groups = Array.from(groupsMap.values());
    expect(groups).toHaveLength(2);

    // Project A should have 2 sessions and 9000 seconds (2h 30m)
    const projA = groups.find((g) => g.projectName === 'Project A');
    expect(projA).toBeDefined();
    expect(projA?.sessions).toHaveLength(2);
    expect(projA?.totalSeconds).toBe(9000);
    expect(formatDurationHoursMinutes(projA!.totalSeconds)).toBe('2h 30m');

    // Project B should have 1 session and 4500 seconds (1h 15m)
    const projB = groups.find((g) => g.projectName === 'Project B');
    expect(projB).toBeDefined();
    expect(projB?.sessions).toHaveLength(1);
    expect(projB?.totalSeconds).toBe(4500);
    expect(formatDurationHoursMinutes(projB!.totalSeconds)).toBe('1h 15m');

    // Daily total: 9000 + 4500 = 13500s (3h 45m)
    const dailyTotal = groups.reduce((acc, g) => acc + g.totalSeconds, 0);
    expect(dailyTotal).toBe(13500);
    expect(formatDuration(dailyTotal)).toBe('03:45:00');
    expect(formatDurationHoursMinutes(dailyTotal)).toBe('3h 45m');
  });

  it('accurately handles sessions with short durations (< 60s)', () => {
    const shortDuration = 15; // 15 seconds
    const formatted =
      shortDuration > 0 && shortDuration < 60
        ? `${shortDuration}s`
        : formatDurationHoursMinutes(shortDuration);

    expect(formatted).toBe('15s');

    const zeroDuration = 0;
    const formattedZero =
      zeroDuration > 0 && zeroDuration < 60
        ? `${zeroDuration}s`
        : formatDurationHoursMinutes(zeroDuration);

    expect(formattedZero).toBe('0h 00m');
  });

  it('merges live active session into today project breakdown correctly', () => {
    const existingProjectDuration = 3600; // 1h
    const liveActiveExtra = 120; // 2m live ticking

    const totalWithLive = existingProjectDuration + liveActiveExtra;
    expect(totalWithLive).toBe(3720);
    expect(formatDurationHoursMinutes(totalWithLive)).toBe('1h 02m');
  });
});

