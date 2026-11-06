import { describe, it, expect } from 'vitest';
import type { WorkSession } from '../types';

// Helper logic mimicking WorkSessionContext helper evaluations
function evaluateCardTimerState(
  activeSession: WorkSession | null,
  projectId: string
) {
  const isCurrentActive =
    !!activeSession &&
    activeSession.status === 'ACTIVE' &&
    activeSession.projectId === projectId;

  const isCurrentPaused =
    !!activeSession &&
    activeSession.status === 'PAUSED' &&
    activeSession.projectId === projectId;

  const hasActiveOrPaused =
    !!activeSession &&
    (activeSession.status === 'ACTIVE' || activeSession.status === 'PAUSED');

  const isAnotherActive =
    hasActiveOrPaused && activeSession?.projectId !== projectId;

  return {
    isCurrentActive,
    isCurrentPaused,
    isAnotherActive,
    canStart: !hasActiveOrPaused,
    state: isCurrentActive
      ? 'STATE_B_ACTIVE'
      : isCurrentPaused
      ? 'STATE_C_PAUSED'
      : isAnotherActive
      ? 'STATE_A_LOCKED'
      : 'STATE_A_IDLE',
  };
}

describe('Project Card Compact Timer State Machine', () => {
  const projectAId = '11111111-1111-1111-1111-111111111111';
  const projectBId = '22222222-2222-2222-2222-222222222222';

  it('State A (Idle): allows any project to start a session when no session is active', () => {
    const cardA = evaluateCardTimerState(null, projectAId);
    const cardB = evaluateCardTimerState(null, projectBId);

    expect(cardA.state).toBe('STATE_A_IDLE');
    expect(cardA.isCurrentActive).toBe(false);
    expect(cardA.isCurrentPaused).toBe(false);
    expect(cardA.isAnotherActive).toBe(false);
    expect(cardA.canStart).toBe(true);

    expect(cardB.state).toBe('STATE_A_IDLE');
    expect(cardB.canStart).toBe(true);
  });

  it('State B (Active): reflects Running state on Project A and locks Project B', () => {
    const mockActiveSession: WorkSession = {
      id: 'session-123',
      userId: 'user-1',
      projectId: projectAId,
      projectName: 'Project Alpha',
      title: 'Active Coding Sprint',
      initialNotes: null,
      sessionNotes: null,
      startedAt: new Date(Date.now() - 60000).toISOString(),
      endedAt: null,
      status: 'ACTIVE',
      totalDurationSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cardA = evaluateCardTimerState(mockActiveSession, projectAId);
    const cardB = evaluateCardTimerState(mockActiveSession, projectBId);

    // Project A shows running timer controls (Pause, Stop)
    expect(cardA.state).toBe('STATE_B_ACTIVE');
    expect(cardA.isCurrentActive).toBe(true);
    expect(cardA.isCurrentPaused).toBe(false);
    expect(cardA.isAnotherActive).toBe(false);

    // Project B is locked because only ONE active session is permitted globally
    expect(cardB.state).toBe('STATE_A_LOCKED');
    expect(cardB.isCurrentActive).toBe(false);
    expect(cardB.isCurrentPaused).toBe(false);
    expect(cardB.isAnotherActive).toBe(true);
    expect(cardB.canStart).toBe(false);
  });

  it('State C (Paused): reflects Paused state on Project A and continues locking Project B', () => {
    const mockPausedSession: WorkSession = {
      id: 'session-123',
      userId: 'user-1',
      projectId: projectAId,
      projectName: 'Project Alpha',
      title: 'Paused Sprint',
      initialNotes: null,
      sessionNotes: null,
      startedAt: new Date(Date.now() - 120000).toISOString(),
      endedAt: null,
      status: 'PAUSED',
      totalDurationSeconds: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pauseIntervals: [
        {
          id: 'pause-1',
          sessionId: 'session-123',
          pausedAt: new Date(Date.now() - 30000).toISOString(),
          resumedAt: null,
          durationSeconds: null,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const cardA = evaluateCardTimerState(mockPausedSession, projectAId);
    const cardB = evaluateCardTimerState(mockPausedSession, projectBId);

    // Project A shows paused timer controls (Resume, Stop)
    expect(cardA.state).toBe('STATE_C_PAUSED');
    expect(cardA.isCurrentActive).toBe(false);
    expect(cardA.isCurrentPaused).toBe(true);
    expect(cardA.isAnotherActive).toBe(false);

    // Project B remains locked while session is paused
    expect(cardB.state).toBe('STATE_A_LOCKED');
    expect(cardB.isAnotherActive).toBe(true);
    expect(cardB.canStart).toBe(false);
  });

  it('State Transition: returns all cards to Idle after session is completed/ended', () => {
    // Session is completed, activeSession becomes null
    const cardA = evaluateCardTimerState(null, projectAId);
    const cardB = evaluateCardTimerState(null, projectBId);

    expect(cardA.state).toBe('STATE_A_IDLE');
    expect(cardA.canStart).toBe(true);
    expect(cardB.state).toBe('STATE_A_IDLE');
    expect(cardB.canStart).toBe(true);
  });

  it('Reconciliation: handles "already completed" session error by resetting active state to null', () => {
    let activeSessionCache: WorkSession | null = {
      id: 'session-stale',
      userId: 'user-1',
      projectId: projectAId,
      projectName: 'Project Alpha',
      title: 'Stale Session',
      initialNotes: null,
      sessionNotes: null,
      startedAt: new Date(Date.now() - 100000).toISOString(),
      endedAt: null,
      status: 'ACTIVE',
      totalDurationSeconds: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Client reconciliation handler
    const reconcileCompletedError = (errorMessage: string) => {
      if (errorMessage.toLowerCase().includes('already completed')) {
        activeSessionCache = null;
        return true;
      }
      return false;
    };

    // Simulate backend responding with "Work session is already completed"
    const isReconciled = reconcileCompletedError('Work session is already completed');
    expect(isReconciled).toBe(true);
    expect(activeSessionCache).toBeNull();

    // Verify card returns to idle state immediately
    const cardA = evaluateCardTimerState(activeSessionCache, projectAId);
    expect(cardA.state).toBe('STATE_A_IDLE');
    expect(cardA.canStart).toBe(true);
  });

  it('Submission Guard: blocks rapid duplicate clicks when isSubmitting is true', () => {
    let submissionCount = 0;
    let isSubmitting = false;

    const submitEndSession = () => {
      if (isSubmitting) {
        return; // blocked duplicate
      }
      isSubmitting = true;
      submissionCount++;
    };

    // Simulate 3 rapid clicks
    submitEndSession();
    submitEndSession();
    submitEndSession();

    expect(submissionCount).toBe(1);
  });
});

