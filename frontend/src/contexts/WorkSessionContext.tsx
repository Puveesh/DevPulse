import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActiveSession, usePauseSession, useResumeSession } from '../hooks/useWorkSessions';
import { calculateWorkingSeconds } from '../lib/utils';
import { StartSessionModal } from '../features/worklog/StartSessionModal';
import { EndSessionModal } from '../features/worklog/EndSessionModal';
import type { WorkSession } from '../types';

export interface WorkSessionContextType {
  activeSession: WorkSession | null;
  isLoading: boolean;
  elapsedSeconds: number;
  openStartModal: (projectId?: string) => void;
  openEndModal: () => void;
  pauseSession: (id: string) => Promise<void>;
  resumeSession: (id: string) => Promise<void>;
  isPausing: boolean;
  isResuming: boolean;
  isSessionActiveForProject: (projectId: string) => boolean;
  isSessionPausedForProject: (projectId: string) => boolean;
  isAnotherProjectActive: (projectId: string) => boolean;
  hasActiveOrPausedSession: boolean;
}

const WorkSessionContext = createContext<WorkSessionContextType | undefined>(undefined);

export function WorkSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: activeSession = null, isLoading } = useActiveSession();
  const pauseMutation = usePauseSession();
  const resumeMutation = useResumeSession();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [sessionForEndModal, setSessionForEndModal] = useState<WorkSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Keep sessionForEndModal synced with activeSession
  useEffect(() => {
    if (activeSession) {
      setSessionForEndModal(activeSession);
    } else {
      setSessionForEndModal(null);
    }
  }, [activeSession]);

  // Live timer tick for active/paused session
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }

    const updateTime = () => {
      const calculated = calculateWorkingSeconds(
        activeSession.startedAt,
        activeSession.endedAt,
        activeSession.pauseIntervals
      );
      setElapsedSeconds(calculated);
    };

    updateTime();

    if (activeSession.status === 'ACTIVE') {
      const interval = setInterval(updateTime, 1000);

      // Instant synchronization upon window focus or Electron restore
      const handleWindowFocus = () => {
        updateTime();
      };

      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleWindowFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleWindowFocus);
      };
    }
  }, [activeSession]);

  const openStartModal = useCallback((projectId?: string) => {
    setSelectedProjectId(projectId);
    setIsStartModalOpen(true);
  }, []);

  const openEndModal = useCallback(() => {
    if (activeSession) {
      setSessionForEndModal(activeSession);
    }
    setIsEndModalOpen(true);
  }, [activeSession]);

  const pauseSession = useCallback(
    async (id: string) => {
      await pauseMutation.mutateAsync(id);
    },
    [pauseMutation]
  );

  const resumeSession = useCallback(
    async (id: string) => {
      await resumeMutation.mutateAsync(id);
    },
    [resumeMutation]
  );

  const isSessionActiveForProject = useCallback(
    (projectId: string) => {
      return (
        !!activeSession &&
        activeSession.status === 'ACTIVE' &&
        activeSession.projectId === projectId
      );
    },
    [activeSession]
  );

  const isSessionPausedForProject = useCallback(
    (projectId: string) => {
      return (
        !!activeSession &&
        activeSession.status === 'PAUSED' &&
        activeSession.projectId === projectId
      );
    },
    [activeSession]
  );

  const hasActiveOrPausedSession =
    !!activeSession &&
    (activeSession.status === 'ACTIVE' || activeSession.status === 'PAUSED');

  const isAnotherProjectActive = useCallback(
    (projectId: string) => {
      return hasActiveOrPausedSession && activeSession?.projectId !== projectId;
    },
    [hasActiveOrPausedSession, activeSession]
  );

  return (
    <WorkSessionContext.Provider
      value={{
        activeSession: activeSession ?? null,
        isLoading,
        elapsedSeconds,
        openStartModal,
        openEndModal,
        pauseSession,
        resumeSession,
        isPausing: pauseMutation.isPending,
        isResuming: resumeMutation.isPending,
        isSessionActiveForProject,
        isSessionPausedForProject,
        isAnotherProjectActive,
        hasActiveOrPausedSession,
      }}
    >
      {children}

      {/* Global Shared Start Modal */}
      <StartSessionModal
        isOpen={isStartModalOpen}
        onClose={() => {
          setIsStartModalOpen(false);
          setSelectedProjectId(undefined);
        }}
        defaultProjectId={selectedProjectId}
      />

      {/* Global Shared End Modal */}
      {sessionForEndModal && (
        <EndSessionModal
          isOpen={isEndModalOpen}
          onClose={() => {
            setIsEndModalOpen(false);
            setSessionForEndModal(null);
          }}
          session={sessionForEndModal}
          elapsedSeconds={elapsedSeconds}
        />
      )}
    </WorkSessionContext.Provider>
  );
}

export function useWorkSessionContext() {
  const context = useContext(WorkSessionContext);
  if (!context) {
    throw new Error('useWorkSessionContext must be used within a WorkSessionProvider');
  }
  return context;
}

