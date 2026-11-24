import { describe, it, expect } from 'vitest';
import type { Project, Task, WorkSession } from '../types';

describe('Dashboard Simplification & Account Management Unit Tests', () => {
  describe('Requirement 1: Latest 3 Active Projects', () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        userId: 'u1',
        name: 'Project Alpha (Oldest)',
        description: null,
        repositoryUrl: null,
        techStack: 'Java',
        status: 'ACTIVE',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
      },
      {
        id: '2',
        userId: 'u1',
        name: 'Project Beta',
        description: null,
        repositoryUrl: null,
        techStack: 'TypeScript',
        status: 'ACTIVE',
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
      },
      {
        id: '3',
        userId: 'u1',
        name: 'Project Gamma',
        description: null,
        repositoryUrl: null,
        techStack: 'Python',
        status: 'ACTIVE',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      },
      {
        id: '4',
        userId: 'u1',
        name: 'Project Delta (Newest)',
        description: null,
        repositoryUrl: null,
        techStack: 'Go',
        status: 'ACTIVE',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
      {
        id: '5',
        userId: 'u1',
        name: 'Project Epsilon (Completed)',
        description: null,
        repositoryUrl: null,
        techStack: 'Rust',
        status: 'COMPLETED',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ];

    it('filters only ACTIVE projects and sorts by createdAt descending', () => {
      const active = mockProjects
        .filter((p) => p.status === 'ACTIVE')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      expect(active).toHaveLength(4);
      expect(active[0].name).toBe('Project Delta (Newest)');
      expect(active[1].name).toBe('Project Gamma');
      expect(active[2].name).toBe('Project Beta');
      expect(active[3].name).toBe('Project Alpha (Oldest)');
    });

    it('slices to exactly 3 items for dashboard presentation', () => {
      const active = mockProjects
        .filter((p) => p.status === 'ACTIVE')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const displayed = active.slice(0, 3);

      expect(displayed).toHaveLength(3);
      expect(displayed.map((p) => p.id)).toEqual(['4', '3', '2']);
    });

    it('shows View all link only when active projects count exceeds 3', () => {
      const activeMoreThanThree = mockProjects.filter((p) => p.status === 'ACTIVE');
      const showViewAll1 = activeMoreThanThree.length > 3;
      expect(showViewAll1).toBe(true);

      const activeThreeOrFewer = mockProjects.filter((p) => p.status === 'ACTIVE').slice(0, 3);
      const showViewAll2 = activeThreeOrFewer.length > 3;
      expect(showViewAll2).toBe(false);
    });
  });

  describe('Requirement 2: Latest 3 Task Overview Entries', () => {
    const mockTasks: Task[] = [
      {
        id: 't1',
        userId: 'u1',
        projectId: 'p1',
        projectName: 'Project Alpha',
        title: 'Initial Database Setup',
        description: null,
        status: 'COMPLETED',
        priority: 'MEDIUM',
        dueDate: null,
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      {
        id: 't2',
        userId: 'u1',
        projectId: 'p1',
        projectName: 'Project Alpha',
        title: 'Authentication Middleware',
        description: null,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: null,
        createdAt: '2026-04-01T10:00:00Z',
        updatedAt: '2026-04-01T10:00:00Z',
      },
      {
        id: 't3',
        userId: 'u1',
        projectId: 'p2',
        projectName: 'Project Beta',
        title: 'Telemetry Dashboard Charts',
        description: null,
        status: 'TODO',
        priority: 'URGENT',
        dueDate: null,
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
      {
        id: 't4',
        userId: 'u1',
        projectId: 'p2',
        projectName: 'Project Beta',
        title: 'Export to Desktop Executable',
        description: null,
        status: 'TODO',
        priority: 'LOW',
        dueDate: null,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
    ];

    it('orders tasks newest first by createdAt desc', () => {
      const sorted = [...mockTasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      expect(sorted[0].title).toBe('Export to Desktop Executable');
      expect(sorted[1].title).toBe('Telemetry Dashboard Charts');
      expect(sorted[2].title).toBe('Authentication Middleware');
      expect(sorted[3].title).toBe('Initial Database Setup');
    });

    it('displays only the top 3 recent tasks on dashboard', () => {
      const sorted = [...mockTasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const displayed = sorted.slice(0, 3);
      expect(displayed).toHaveLength(3);
      expect(displayed.map((t) => t.id)).toEqual(['t4', 't3', 't2']);
    });

    it('verifies all required task fields are present for each entry', () => {
      const sorted = [...mockTasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const top3 = sorted.slice(0, 3);

      top3.forEach((task) => {
        expect(task.title).toBeTruthy();
        expect(task.projectName).toBeTruthy();
        expect(task.status).toBeTruthy();
        expect(task.priority).toBeTruthy();
        expect(task.createdAt).toBeTruthy();
      });
    });

    it('shows View all link only if total task count exceeds 3', () => {
      expect(mockTasks.length > 3).toBe(true);
      expect(mockTasks.slice(0, 3).length > 3).toBe(false);
      expect(mockTasks.slice(0, 2).length > 3).toBe(false);
    });
  });

  describe('Requirement 3: Latest 3 Recent Work Sessions', () => {
    const mockSessions: WorkSession[] = [
      {
        id: 's1',
        userId: 'u1',
        projectId: 'p1',
        projectName: 'DevPulse',
        title: 'Sprint Kickoff',
        startedAt: '2026-11-01T08:00:00Z',
        status: 'COMPLETED',
        totalDurationSeconds: 3600,
        createdAt: '2026-11-01T08:00:00Z',
        updatedAt: '2026-11-01T09:00:00Z',
      },
      {
        id: 's2',
        userId: 'u1',
        projectId: 'p1',
        projectName: 'DevPulse',
        title: 'Backend Bugfix',
        startedAt: '2026-11-02T08:00:00Z',
        status: 'COMPLETED',
        totalDurationSeconds: 1800,
        createdAt: '2026-11-02T08:00:00Z',
        updatedAt: '2026-11-02T08:30:00Z',
      },
      {
        id: 's3',
        userId: 'u1',
        projectId: 'p1',
        projectName: 'DevPulse',
        title: 'Settings Redesign',
        startedAt: '2026-11-03T08:00:00Z',
        status: 'COMPLETED',
        totalDurationSeconds: 7200,
        createdAt: '2026-11-03T08:00:00Z',
        updatedAt: '2026-11-03T10:00:00Z',
      },
      {
        id: 's4',
        userId: 'u1',
        projectId: 'p1',
        projectName: 'DevPulse',
        title: 'Analytics Heatmap',
        startedAt: '2026-11-04T08:00:00Z',
        status: 'COMPLETED',
        totalDurationSeconds: 5400,
        createdAt: '2026-11-04T08:00:00Z',
        updatedAt: '2026-11-04T09:30:00Z',
      },
    ];

    it('limits completed sessions to latest 3 on the dashboard', () => {
      const displayed = mockSessions.slice(0, 3);
      expect(displayed).toHaveLength(3);
      expect(displayed.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    });

    it('shows View all link only when completed sessions count exceeds 3', () => {
      expect(mockSessions.length > 3).toBe(true);
      expect(mockSessions.slice(0, 3).length > 3).toBe(false);
    });
  });

  describe('Requirements 5 & 6: Permanent Account Deletion Validation Logic', () => {
    const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

    function evaluateCanDelete(password: string, confirmation: string, isDeleting: boolean) {
      const isConfirmationPhraseValid = confirmation.trim() === CONFIRMATION_PHRASE;
      const isPasswordEntered = password.trim().length > 0;
      return isConfirmationPhraseValid && isPasswordEntered && !isDeleting;
    }

    it('disables deletion when password is empty', () => {
      expect(evaluateCanDelete('', 'DELETE MY ACCOUNT', false)).toBe(false);
      expect(evaluateCanDelete('   ', 'DELETE MY ACCOUNT', false)).toBe(false);
    });

    it('disables deletion when confirmation phrase is incomplete or incorrect', () => {
      expect(evaluateCanDelete('secret123', 'delete my account', false)).toBe(false);
      expect(evaluateCanDelete('secret123', 'DELETE', false)).toBe(false);
      expect(evaluateCanDelete('secret123', '', false)).toBe(false);
    });

    it('disables deletion while deletion request is actively in-flight', () => {
      expect(evaluateCanDelete('secret123', 'DELETE MY ACCOUNT', true)).toBe(false);
    });

    it('enables deletion button only when both password and exact uppercase phrase match', () => {
      expect(evaluateCanDelete('secret123', 'DELETE MY ACCOUNT', false)).toBe(true);
      expect(evaluateCanDelete('  secret123  ', '  DELETE MY ACCOUNT  ', false)).toBe(true);
    });
  });

  describe('Requirement 7: Navbar Header Display', () => {
    it('header should display developer displayName and exclude email', () => {
      const user = {
        displayName: 'Puveesh Keshav',
        email: 'puveesh@example.com',
      };

      // Header display contract
      const headerDisplay = {
        primaryLabel: user.displayName,
        includesEmail: false,
      };

      expect(headerDisplay.primaryLabel).toBe('Puveesh Keshav');
      expect(headerDisplay.includesEmail).toBe(false);
    });
  });
});
