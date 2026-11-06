import { useState } from 'react';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { useWorkSessions } from '../../hooks/useWorkSessions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Clock, Play, Pause, Square, FileText, Calendar, FolderKanban } from 'lucide-react';
import { formatDate, formatTime, formatDuration } from '../../lib/utils';
import { SessionDetailModal } from './SessionDetailModal';
import type { WorkSession } from '../../types';

export function WorkSessionsPage() {
  const {
    activeSession,
    elapsedSeconds,
    openStartModal,
    openEndModal,
    pauseSession,
    resumeSession,
    isPausing,
    isResuming,
  } = useWorkSessionContext();
  const { data: sessionsData, isLoading } = useWorkSessions(0, 50);

  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);

  const allSessions = sessionsData?.content || [];
  const completedSessions = allSessions.filter((s) => s.status === 'COMPLETED');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Work Sessions</h1>
          <p className="text-xs text-zinc-400 mt-1">Live tracking and development logs.</p>
        </div>

        <div>
          {!activeSession ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={() => openStartModal()}
            >
              Start Session
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="bg-red-600 hover:bg-red-500 border-none text-white"
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={openEndModal}
            >
              End Session ({formatDuration(elapsedSeconds)})
            </Button>
          )}
        </div>
      </div>

      {/* Active Session Banner if in progress or paused */}
      {activeSession && (
        <Card className="border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {activeSession.status === 'ACTIVE' ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Active Session in Progress
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Session Paused
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{activeSession.title}</h3>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                  {activeSession.projectName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Started {formatTime(activeSession.startedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Working Time</span>
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {formatDuration(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeSession.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Pause className="w-3.5 h-3.5 text-amber-400" />}
                    isLoading={isPausing}
                    disabled={isPausing}
                    onClick={() => pauseSession(activeSession.id)}
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
                    isLoading={isResuming}
                    disabled={isResuming}
                    onClick={() => resumeSession(activeSession.id)}
                  >
                    Resume
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-500 border-none text-white"
                  leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
                  onClick={openEndModal}
                >
                  End & Save
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sessions History List */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>All development sessions recorded in your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center text-xs text-zinc-500">Loading work sessions...</div>
          ) : completedSessions.length > 0 ? (
            <div className="divide-y divide-zinc-800/80">
              {completedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 p-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100 truncate">{session.title}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                        {session.projectName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {formatDate(session.startedAt)}
                      </span>
                      <span>
                        {formatTime(session.startedAt)} &rarr; {session.endedAt ? formatTime(session.endedAt) : ''}
                      </span>
                    </div>

                    {session.initialNotes && (
                      <p className="text-xs text-zinc-400 flex items-start gap-1.5 italic">
                        <span className="text-zinc-500 not-italic">Initial:</span>
                        <span>{session.initialNotes}</span>
                      </p>
                    )}

                    {session.sessionNotes && (
                      <p className="text-xs text-zinc-300 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        <span className="line-clamp-2">{session.sessionNotes}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-zinc-200 block">
                      {formatDuration(session.totalDurationSeconds || 0)}
                    </span>
                    <span className="text-[10px] text-blue-400 hover:underline">View & Edit Notes</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-8 h-8 text-blue-400" />}
              title="No Work Sessions Yet"
              description="Start a development session to track your time and progress automatically."
              actionText="Start First Session"
              onAction={() => openStartModal()}
            />
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <SessionDetailModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </div>
  );
}
