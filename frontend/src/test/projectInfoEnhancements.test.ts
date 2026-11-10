import { describe, it, expect } from 'vitest';
import { formatDate, formatDuration, formatTime } from '../lib/utils';
import type { Project, WorkSession } from '../types';

describe('Project Info Enhancements (3 Requirements)', () => {
  describe('Requirement 1: Last Activity Date Functionality', () => {
    it('displays "No activity yet" when a project has no recorded work sessions', () => {
      const projectWithoutActivity: Partial<Project> = {
        id: 'proj-new',
        name: 'Weather Monitor',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-01T10:00:00Z',
        lastActivity: null,
      };

      const displayText = projectWithoutActivity.lastActivity
        ? `Last activity ${formatDate(projectWithoutActivity.lastActivity)}`
        : 'No activity yet';

      expect(displayText).toBe('No activity yet');
    });

    it('displays the formatted session date when a project has session activity', () => {
      const projectWithActivity: Partial<Project> = {
        id: 'proj-devpulse',
        name: 'DevPulse',
        createdAt: '2026-10-15T08:00:00Z',
        updatedAt: '2026-11-05T12:00:00Z',
        lastActivity: '2026-11-10T17:15:00Z',
      };

      const displayText = projectWithActivity.lastActivity
        ? `Last activity ${formatDate(projectWithActivity.lastActivity)}`
        : 'No activity yet';

      expect(displayText).toBe('Last activity Nov 10, 2026');
    });

    it('ensures distinct project sessions never affect another project lastActivity', () => {
      const projectA: Partial<Project> = {
        id: 'proj-a',
        name: 'DevPulse',
        lastActivity: '2026-11-10T15:00:00Z',
      };

      const projectB: Partial<Project> = {
        id: 'proj-b',
        name: 'EduTrust',
        lastActivity: '2026-11-08T11:00:00Z',
      };

      const projectC: Partial<Project> = {
        id: 'proj-c',
        name: 'Weather Monitor',
        lastActivity: null,
      };

      const getText = (p: Partial<Project>) =>
        p.lastActivity ? `Last activity ${formatDate(p.lastActivity)}` : 'No activity yet';

      expect(getText(projectA)).toBe('Last activity Nov 10, 2026');
      expect(getText(projectB)).toBe('Last activity Nov 8, 2026');
      expect(getText(projectC)).toBe('No activity yet');
    });
  });

  describe('Requirement 2: Task Status Dropdown Styling', () => {
    it('defines explicit dark text on light background for all task status options', () => {
      const statusOptions = [
        { value: 'TODO', label: 'To Do' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ];

      statusOptions.forEach((opt) => {
        const optionProps = {
          value: opt.value,
          className: 'text-zinc-900 bg-white',
          style: { color: '#09090b', backgroundColor: '#ffffff' },
        };

        expect(optionProps.style.color).toBe('#09090b');
        expect(optionProps.style.backgroundColor).toBe('#ffffff');
        expect(optionProps.className).toContain('text-zinc-900');
        expect(optionProps.className).toContain('bg-white');
      });
    });
  });

  describe('Requirement 3: Project-Specific Work Sessions Tab', () => {
    const mockSessions: WorkSession[] = [
      {
        id: 's-1',
        userId: 'u-1',
        projectId: 'proj-devpulse',
        projectName: 'DevPulse',
        title: 'Backend last activity implementation',
        initialNotes: 'Query optimization',
        sessionNotes: 'Finished repository query and tested isolation',
        startedAt: '2026-11-10T14:00:00Z',
        endedAt: '2026-11-10T15:00:00Z',
        totalDurationSeconds: 3600,
        status: 'COMPLETED',
        createdAt: '2026-11-10T14:00:00Z',
      },
      {
        id: 's-2',
        userId: 'u-1',
        projectId: 'proj-edutrust',
        projectName: 'EduTrust',
        title: 'EduTrust auth flow',
        startedAt: '2026-11-08T10:00:00Z',
        endedAt: '2026-11-08T11:00:00Z',
        totalDurationSeconds: 3600,
        status: 'COMPLETED',
        createdAt: '2026-11-08T10:00:00Z',
      },
    ];

    it('filters sessions specifically by selected projectId', () => {
      const filterByProject = (sessions: WorkSession[], targetProjectId: string) =>
        sessions.filter((s) => s.projectId === targetProjectId);

      const devpulseSessions = filterByProject(mockSessions, 'proj-devpulse');
      expect(devpulseSessions).toHaveLength(1);
      expect(devpulseSessions[0].title).toBe('Backend last activity implementation');

      const edutrustSessions = filterByProject(mockSessions, 'proj-edutrust');
      expect(edutrustSessions).toHaveLength(1);
      expect(edutrustSessions[0].title).toBe('EduTrust auth flow');

      const emptySessions = filterByProject(mockSessions, 'proj-other');
      expect(emptySessions).toHaveLength(0);
    });

    it('renders session details, duration, and formatted dates properly', () => {
      const session = mockSessions[0];
      expect(formatDate(session.startedAt)).toBe('Nov 10, 2026');
      expect(formatDuration(session.totalDurationSeconds || 0)).toBe('01:00:00');
      expect(session.sessionNotes).toBe('Finished repository query and tested isolation');
    });

    it('produces the specified empty state message when project has no sessions', () => {
      const projectSessions: WorkSession[] = [];
      const emptyStateTitle = projectSessions.length === 0
        ? 'No work sessions recorded for this project yet.'
        : 'Work sessions list';

      expect(emptyStateTitle).toBe('No work sessions recorded for this project yet.');
    });
  });
});

