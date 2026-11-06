import React, { useMemo } from 'react';
import {
  Clock,
  FolderKanban,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useTodayAnalytics } from '../../hooks/useAnalytics';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import {
  formatDate,
  formatTime,
  formatDurationHoursMinutes,
  formatDuration,
} from '../../lib/utils';
import type { TodaySession, WorkSession } from '../../types';

interface TodayWorklogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSessionForDetails?: (session: WorkSession) => void;
}

interface ProjectSessionGroup {
  projectId: string;
  projectName: string;
  totalDurationSeconds: number;
  sessions: TodaySession[];
}

export const TodayWorklogModal: React.FC<TodayWorklogModalProps> = ({
  isOpen,
  onClose,
  onSelectSessionForDetails,
}) => {
  const { data: todayData, isLoading } = useTodayAnalytics();
  const { activeSession, elapsedSeconds } = useWorkSessionContext();

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Real-time dynamic ticking for active session without repeated polling
  const liveActiveExtra =
    activeSession && activeSession.status === 'ACTIVE'
      ? Math.max(0, elapsedSeconds - (todayData?.activeSessionTodayWorkingSeconds || 0))
      : 0;

  const liveTotalTodaySeconds = (todayData?.totalDurationSeconds || 0) + liveActiveExtra;

  // Group today's sessions by project and merge active session if needed
  const projectGroups: ProjectSessionGroup[] = useMemo(() => {
    const rawSessions: TodaySession[] = todayData?.sessions ? [...todayData.sessions] : [];

    // Check if the current active session is already in rawSessions
    if (activeSession) {
      const existingIdx = rawSessions.findIndex((s) => s.id === activeSession.id);
      if (existingIdx >= 0) {
        rawSessions[existingIdx] = {
          ...rawSessions[existingIdx],
          status: activeSession.status,
          todayWorkingSeconds:
            (rawSessions[existingIdx].todayWorkingSeconds || 0) + liveActiveExtra,
          sessionNotes: activeSession.sessionNotes,
        };
      } else {
        rawSessions.unshift({
          id: activeSession.id,
          projectId: activeSession.projectId || 'unassigned',
          projectName: activeSession.projectName || 'General Development',
          title: activeSession.title,
          status: activeSession.status,
          startedAt: activeSession.startedAt,
          endedAt: activeSession.endedAt,
          todayWorkingSeconds: liveActiveExtra,
          totalDurationSeconds: elapsedSeconds,
          initialNotes: activeSession.initialNotes,
          sessionNotes: activeSession.sessionNotes,
        });
      }
    }

    // Group by project
    const groupsMap = new Map<string, ProjectSessionGroup>();

    rawSessions.forEach((session) => {
      const key = session.projectId || session.projectName || 'unassigned';
      const existing = groupsMap.get(key) || {
        projectId: session.projectId || 'unassigned',
        projectName: session.projectName || 'General Development',
        totalDurationSeconds: 0,
        sessions: [],
      };

      existing.totalDurationSeconds += session.todayWorkingSeconds || 0;
      existing.sessions.push(session);
      groupsMap.set(key, existing);
    });

    // Sort groups descending by total working duration
    return Array.from(groupsMap.values()).sort(
      (a, b) => b.totalDurationSeconds - a.totalDurationSeconds
    );
  }, [todayData?.sessions, activeSession, liveActiveExtra, elapsedSeconds]);

  const completedSessionsCount = useMemo(() => {
    const list = todayData?.sessions || [];
    return list.filter((s) => s.status === 'COMPLETED').length;
  }, [todayData?.sessions]);

  const distinctProjectsCount = projectGroups.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Today's Time Logs"
      className="max-w-2xl max-h-[82vh] flex flex-col"
      contentClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
    >
      <div className="space-y-3 flex-1 min-h-0 flex flex-col">
        {/* Compact Daily Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400">Total:</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-zinc-100 text-sm">
                  {formatDuration(liveTotalTodaySeconds)}
                </span>
                <span className="text-zinc-500 font-mono text-[11px]">
                  ({formatDurationHoursMinutes(liveTotalTodaySeconds)})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {isLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <span>
                  <strong className="font-mono text-zinc-200">{completedSessionsCount}</strong>{' '}
                  completed
                  {activeSession && (
                    <span className="text-emerald-400 font-medium text-[11px] ml-1">
                      (+1 active)
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              {isLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <span>
                  <strong className="font-mono text-zinc-200">{distinctProjectsCount}</strong>{' '}
                  {distinctProjectsCount === 1 ? 'project' : 'projects'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Compact Project Groups & Session Time Logs */}
        {isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : projectGroups.length === 0 ? (
          <div className="py-6">
            <EmptyState
              icon={<Clock className="w-7 h-7" />}
              title="No development time logged today"
              description="Start a development session using the timer button to log your coding activity."
            />
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto flex-1 min-h-0 pr-1">
            {projectGroups.map((group) => (
              <div
                key={group.projectId}
                className="rounded-lg border border-zinc-800/90 bg-zinc-900/40 overflow-hidden"
              >
                {/* Compact Project Header Bar */}
                <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800/70 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <h4 className="text-xs font-semibold text-zinc-100 truncate">
                      {group.projectName}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'})
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold text-zinc-200 shrink-0">
                    {formatDuration(group.totalDurationSeconds)}
                  </span>
                </div>

                {/* Compact Time Logs (One line per session) */}
                <div className="divide-y divide-zinc-850/60 p-0.5">
                  {group.sessions.map((session) => {
                    const isOngoing = session.status === 'ACTIVE';
                    const isPaused = session.status === 'PAUSED';

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-850/40 transition-colors rounded text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-zinc-200 truncate">
                            {session.title}
                          </span>

                          {isOngoing && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              Active
                            </span>
                          )}

                          {isPaused && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                              Paused
                            </span>
                          )}

                          {!isOngoing && !isPaused && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 text-zinc-400 shrink-0">
                              Completed
                            </span>
                          )}

                          <span className="text-zinc-500 text-[11px] font-mono shrink-0 hidden sm:inline">
                            {formatTime(session.startedAt)} – {session.endedAt ? formatTime(session.endedAt) : 'Now'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono font-bold text-zinc-100 text-xs">
                            {session.todayWorkingSeconds > 0 && session.todayWorkingSeconds < 60
                              ? `${session.todayWorkingSeconds}s`
                              : formatDuration(session.todayWorkingSeconds)}
                          </span>

                          {(session.initialNotes || session.sessionNotes) && onSelectSessionForDetails && (
                            <button
                              onClick={() => {
                                onSelectSessionForDetails({
                                  id: session.id,
                                  userId: '',
                                  projectId: session.projectId,
                                  projectName: session.projectName,
                                  title: session.title,
                                  status: session.status,
                                  startedAt: session.startedAt,
                                  endedAt: session.endedAt || null,
                                  totalDurationSeconds: session.todayWorkingSeconds,
                                  initialNotes: session.initialNotes || null,
                                  sessionNotes: session.sessionNotes || null,
                                  createdAt: session.startedAt,
                                  updatedAt: session.startedAt,
                                });
                              }}
                              title="View notes"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="sr-only">Notes</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
