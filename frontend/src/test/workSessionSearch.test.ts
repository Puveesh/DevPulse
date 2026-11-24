import { describe, it, expect } from 'vitest';
import type { WorkSession, WorkSessionSearchParams } from '../types';

/**
 * Pure evaluation helper mimicking client-side and backend search filtering logic
 * enforcing pure OR semantics, date precedence, and case-insensitivity.
 */
function evaluateSearchMatch(
  session: WorkSession,
  params: WorkSessionSearchParams
): boolean {
  const hasTitle = Boolean(params.title && params.title.trim());
  const hasProject = Boolean(params.projectId && params.projectId.trim());
  const hasDate = Boolean(params.date && params.date.trim());
  const hasMonth = Boolean(params.month !== undefined && params.month >= 1 && params.month <= 12);
  const hasYear = Boolean(params.year !== undefined);

  const hasAnyFilter = hasTitle || hasProject || hasDate || hasMonth || hasYear;
  if (!hasAnyFilter) {
    return true; // No filter active => return all sessions
  }

  // Title match: case-insensitive partial substring
  let titleMatch = false;
  if (hasTitle && params.title) {
    const term = params.title.trim().toLowerCase();
    titleMatch = session.title.toLowerCase().includes(term);
  }

  // Project match: exact ID match
  let projectMatch = false;
  if (hasProject && params.projectId) {
    projectMatch = session.projectId === params.projectId;
  }

  // Date match: Precedence: Specific date > Month > Year
  let dateMatch = false;
  const sessionStart = new Date(session.startedAt);
  const sessionEnd = session.endedAt ? new Date(session.endedAt) : sessionStart;

  if (hasDate && params.date) {
    const targetDate = params.date.trim(); // YYYY-MM-DD
    const startStr = sessionStart.toISOString().slice(0, 10);
    const endStr = sessionEnd.toISOString().slice(0, 10);
    dateMatch = targetDate >= startStr && targetDate <= endStr;
  } else if (hasMonth && params.month !== undefined) {
    const sessionMonth = sessionStart.getMonth() + 1;
    if (params.year !== undefined) {
      const sessionYear = sessionStart.getFullYear();
      dateMatch = sessionYear === params.year && sessionMonth === params.month;
    } else {
      dateMatch = sessionMonth === params.month;
    }
  } else if (hasYear && params.year !== undefined) {
    dateMatch = sessionStart.getFullYear() === params.year;
  }

  // Pure OR logic across all active criteria
  return titleMatch || projectMatch || dateMatch;
}

describe('Work Session Search and Filter Pure OR-Logic Evaluation', () => {
  const sampleSessions: WorkSession[] = [
    {
      id: 'ws-1',
      userId: 'user-1',
      projectId: 'proj-1',
      projectName: 'DevPulse',
      title: 'Backend API Development',
      startedAt: '2026-11-20T10:00:00Z',
      endedAt: '2026-11-20T12:00:00Z',
      totalDurationSeconds: 7200,
      status: 'COMPLETED',
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T12:00:00Z',
    },
    {
      id: 'ws-2',
      userId: 'user-1',
      projectId: 'proj-2',
      projectName: 'EduTrust',
      title: 'UI Redesign Session',
      startedAt: '2026-05-15T14:00:00Z',
      endedAt: '2026-05-15T16:00:00Z',
      totalDurationSeconds: 7200,
      status: 'COMPLETED',
      createdAt: '2026-05-15T14:00:00Z',
      updatedAt: '2026-05-15T16:00:00Z',
    },
    {
      id: 'ws-3',
      userId: 'user-1',
      projectId: 'proj-3',
      projectName: 'Weather Monitoring',
      title: 'Sensor Data Integration',
      startedAt: '2025-08-10T09:00:00Z',
      endedAt: '2025-08-10T11:00:00Z',
      totalDurationSeconds: 7200,
      status: 'COMPLETED',
      createdAt: '2025-08-10T09:00:00Z',
      updatedAt: '2025-08-10T11:00:00Z',
    },
    {
      id: 'ws-4',
      userId: 'user-1',
      projectId: 'proj-2',
      projectName: 'EduTrust',
      title: 'Database Migration Scripts',
      startedAt: '2026-11-23T23:30:00Z',
      endedAt: '2026-11-24T01:30:00Z', // Crosses midnight
      totalDurationSeconds: 7200,
      status: 'COMPLETED',
      createdAt: '2026-11-23T23:30:00Z',
      updatedAt: '2026-11-24T01:30:00Z',
    },
  ];

  it('returns all sessions when no filters are set', () => {
    const results = sampleSessions.filter((s) => evaluateSearchMatch(s, {}));
    expect(results).toHaveLength(4);
  });

  it('matches by title (case-insensitive and trimmed)', () => {
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { title: '  backend  ' })
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('ws-1');
  });

  it('matches by project ID', () => {
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { projectId: 'proj-2' })
    );
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['ws-2', 'ws-4']);
  });

  it('pure OR logic: matches ANY active criteria', () => {
    // Search for title "Sensor" OR project "proj-1" (DevPulse)
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { title: 'Sensor', projectId: 'proj-1' })
    );
    // ws-1 matches proj-1; ws-3 matches "Sensor"
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id).sort()).toEqual(['ws-1', 'ws-3']);
  });

  it('returns sessions matching month across all years', () => {
    // Month 11 (November)
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { month: 11 })
    );
    // ws-1 (Nov 2026) and ws-4 (Nov 2026)
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['ws-1', 'ws-4']);
  });

  it('returns sessions matching independent year filter', () => {
    // Year 2025
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { year: 2025 })
    );
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('ws-3');
  });

  it('handles cross-midnight session matching either date in OR mode', () => {
    // ws-4 started at 2026-11-23 and ended at 2026-11-24
    const matchStartDay = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { date: '2026-11-23' })
    );
    expect(matchStartDay.some((s) => s.id === 'ws-4')).toBe(true);

    const matchEndDay = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, { date: '2026-11-24' })
    );
    expect(matchEndDay.some((s) => s.id === 'ws-4')).toBe(true);
  });

  it('combines title, project, and date in three-way OR condition', () => {
    // title "Backend" (ws-1) OR project "proj-3" (ws-3) OR date "2026-05-15" (ws-2)
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, {
        title: 'Backend',
        projectId: 'proj-3',
        date: '2026-05-15',
      })
    );
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.id).sort()).toEqual(['ws-1', 'ws-2', 'ws-3']);
  });

  it('excludes sessions that do not match any of the active OR criteria', () => {
    const results = sampleSessions.filter((s) =>
      evaluateSearchMatch(s, {
        title: 'Nonexistent Keyword',
        projectId: 'non-existent-proj',
      })
    );
    expect(results).toHaveLength(0);
  });
});
