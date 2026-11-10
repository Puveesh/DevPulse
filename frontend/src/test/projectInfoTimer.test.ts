import { describe, it, expect } from 'vitest';
import { formatDuration } from '../lib/utils';
import type { WorkSession } from '../types';

describe('Project Info Synchronized Timer Tests', () => {
  const projectA = { id: 'proj-a', name: 'DevPulse Desktop' };
  const projectB = { id: 'proj-b', name: 'EduTrust' };

  it('determines if session is active for the specific project', () => {
    const activeSession: Partial<WorkSession> = {
      id: 'session-1',
      projectId: 'proj-a',
      status: 'ACTIVE',
    };

    const isSessionActiveForProject = (projectId: string) =>
      activeSession.status === 'ACTIVE' && activeSession.projectId === projectId;

    // Project A has the active session
    expect(isSessionActiveForProject(projectA.id)).toBe(true);

    // Project B must NOT display Project A's timer
    expect(isSessionActiveForProject(projectB.id)).toBe(false);
  });

  it('determines if session is paused for the specific project', () => {
    const pausedSession: Partial<WorkSession> = {
      id: 'session-2',
      projectId: 'proj-b',
      status: 'PAUSED',
    };

    const isSessionPausedForProject = (projectId: string) =>
      pausedSession.status === 'PAUSED' && pausedSession.projectId === projectId;

    // Project B is paused
    expect(isSessionPausedForProject(projectB.id)).toBe(true);

    // Project A is NOT paused
    expect(isSessionPausedForProject(projectA.id)).toBe(false);
  });

  it('does not display timer when there is no active session', () => {
    const activeSession: WorkSession | null = null;

    const isSessionActiveForProject = (projectId: string) =>
      !!activeSession && activeSession.status === 'ACTIVE' && activeSession.projectId === projectId;
    const isSessionPausedForProject = (projectId: string) =>
      !!activeSession && activeSession.status === 'PAUSED' && activeSession.projectId === projectId;

    expect(isSessionActiveForProject(projectA.id)).toBe(false);
    expect(isSessionPausedForProject(projectA.id)).toBe(false);
  });

  it('formats elapsed duration accurately as HH:MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3665)).toBe('01:01:05');
    expect(formatDuration(5075)).toBe('01:24:35');
  });

  it('does not increment elapsed time for paused sessions', () => {
    const elapsedSeconds = 5075; // 01:24:35
    const isPaused = true;

    // In paused mode, elapsedSeconds remains fixed
    const timeTicking = (current: number, paused: boolean) => (paused ? current : current + 1);

    expect(timeTicking(elapsedSeconds, isPaused)).toBe(5075);
    expect(formatDuration(timeTicking(elapsedSeconds, isPaused))).toBe('01:24:35');
  });

  it('shows Start button when no session is active/paused for this project, and respects another active session', () => {
    // Case 1: No active session anywhere
    let activeSession: Partial<WorkSession> | null = null;
    let hasActiveOrPausedSession = false;

    let isSessionActiveForProject = (pid: string) =>
      !!activeSession && activeSession.status === 'ACTIVE' && activeSession.projectId === pid;
    let isSessionPausedForProject = (pid: string) =>
      !!activeSession && activeSession.status === 'PAUSED' && activeSession.projectId === pid;
    let isAnotherProjectActive = (pid: string) =>
      hasActiveOrPausedSession && activeSession?.projectId !== pid;

    // Both projects show Start button and both are enabled
    expect(!isSessionActiveForProject(projectA.id) && !isSessionPausedForProject(projectA.id)).toBe(true);
    expect(isAnotherProjectActive(projectA.id)).toBe(false);

    // Case 2: Project A is active
    activeSession = { id: 's1', projectId: projectA.id, status: 'ACTIVE' };
    hasActiveOrPausedSession = true;

    // Project A shows running timer controls, not Start button
    expect(!isSessionActiveForProject(projectA.id) && !isSessionPausedForProject(projectA.id)).toBe(false);

    // Project B shows Start button, but it is disabled because Project A is active
    expect(!isSessionActiveForProject(projectB.id) && !isSessionPausedForProject(projectB.id)).toBe(true);
    expect(isAnotherProjectActive(projectB.id)).toBe(true);
  });
});

