import React, { useMemo } from 'react';
import {
  Clock,
  FolderKanban,
  CheckCircle2,
  Calendar,
  FileText,
  Edit3,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
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
        // Update its working seconds and status with live values
        rawSessions[existingIdx] = {
          ...rawSessions[existingIdx],
          status: activeSession.status,
          todayWorkingSeconds:
            (rawSessions[existingIdx].todayWorkingSeconds || 0) + liveActiveExtra,
          sessionNotes: activeSession.sessionNotes,
        };
      } else {
        // Active session started recently, prepend it
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
      title="Today's Development Worklogs"
      description={`Today, ${formatDate(todayStr)} — Detailed project-wise breakdown of coding sessions.`}
      className="max-w-3xl sm:max-w-4xl max-h-[85vh] flex flex-col"
    >
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* Daily Summary Key Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Today's Logged Time
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-24 mt-1" />
            ) : (
              <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {formatDuration(liveTotalTodaySeconds)}
              </div>
            )}
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
              {formatDurationHoursMinutes(liveTotalTodaySeconds)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sessions
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {completedSessionsCount}{' '}
                <span className="text-xs text-zinc-400 font-sans font-normal">completed</span>
                {activeSession && (
                  <span className="text-xs text-emerald-400 font-sans ml-1.5">
                    + 1 active
                  </span>
                )}
              </div>
            )}
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Total today: {todayData?.sessionCount || (activeSession ? 1 : 0)}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              Projects Worked On
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {distinctProjectsCount}{' '}
                <span className="text-xs text-zinc-400 font-sans font-normal">
                  {distinctProjectsCount === 1 ? 'project' : 'projects'}
                </span>
              </div>
            )}
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Distinct codebases
            </span>
          </div>
        </div>

        {/* Project-Wise Grouped Work Sessions */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : projectGroups.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Clock className="w-8 h-8" />}
              title="No development time logged today"
              description="Start a development session using the timer button or from a project card to track your coding time."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {projectGroups.map((group) => (
              <div
                key={group.projectId}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/30 overflow-hidden"
              >
                {/* Project Header Bar */}
                <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">
                        {group.projectName}
                      </h4>
                      <span className="text-[11px] text-zinc-400">
                        {group.sessions.length}{' '}
                        {group.sessions.length === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-sm font-bold text-zinc-100 block">
                      {formatDuration(group.totalDurationSeconds)}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {formatDurationHoursMinutes(group.totalDurationSeconds)}
                    </span>
                  </div>
                </div>

                {/* Sessions in this Project */}
                <div className="divide-y divide-zinc-850/80 p-1">
                  {group.sessions.map((session) => {
                    const isOngoing = session.status === 'ACTIVE';
                    const isPaused = session.status === 'PAUSED';

                    return (
                      <div
                        key={session.id}
                        className="p-3 hover:bg-zinc-850/40 transition-colors space-y-2 rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-200 truncate">
                                {session.title}
                              </span>

                              {isOngoing && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                  Active Session
                                </span>
                              )}

                              {isPaused && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                  Paused
                                </span>
                              )}

                              {!isOngoing && !isPaused && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                                  Completed
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                {formatTime(session.startedAt)}
                                {' – '}
                                {session.endedAt ? formatTime(session.endedAt) : 'In progress'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="font-mono text-xs font-bold text-zinc-100">
                              {session.todayWorkingSeconds > 0 && session.todayWorkingSeconds < 60
                                ? `${session.todayWorkingSeconds}s`
                                : formatDuration(session.todayWorkingSeconds)}
                            </span>

                            {onSelectSessionForDetails && (
                              <Button
                                size="sm"
                                variant="ghost"
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
                                className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
                                leftIcon={<Edit3 className="w-3 h-3" />}
                              >
                                Notes
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Notes Section if available */}
                        {(session.initialNotes || session.sessionNotes) && (
                          <div className="pt-1.5 space-y-1 text-xs">
                            {session.initialNotes && (
                              <div className="flex items-start gap-1.5 text-zinc-400 text-[11px] bg-zinc-950/40 p-2 rounded-md border border-zinc-800/60">
                                <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-zinc-500 font-medium">Initial notes: </span>
                                  <span className="text-zinc-300">{session.initialNotes}</span>
                                </div>
                              </div>
                            )}

                            {session.sessionNotes && (
                              <div className="flex items-start gap-1.5 text-zinc-400 text-[11px] bg-zinc-950/40 p-2 rounded-md border border-zinc-800/60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-zinc-500 font-medium">End notes: </span>
                                  <span className="text-zinc-300">{session.sessionNotes}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
