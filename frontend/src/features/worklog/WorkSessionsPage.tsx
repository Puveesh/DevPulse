import { useState, useEffect } from 'react';
import {
  useActiveSession,
  useRecentSessions,
  useTodayDuration,
  useCancelSession,
} from '../../hooks/useWorkSessions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Clock, Play, Square, X, Calendar, FileText } from 'lucide-react';
import { formatDate, formatDuration } from '../../lib/utils';
import { StartSessionModal } from './StartSessionModal';
import { EndSessionModal } from './EndSessionModal';

export function WorkSessionsPage() {
  const { data: activeSession } = useActiveSession();
  const { data: sessions = [], isLoading } = useRecentSessions();
  const { data: todayDuration = 0 } = useTodayDuration();
  const cancelSessionMutation = useCancelSession();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeSession?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeSession.startedAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startedAt]);

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
              onClick={() => setIsStartModalOpen(true)}
            >
              Start Session
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="bg-red-600 hover:bg-red-500 border-none text-white"
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={() => setIsEndModalOpen(true)}
            >
              End Session ({formatDuration(elapsedSeconds)})
            </Button>
          )}
        </div>
      </div>

      {/* Active Session Banner if in progress */}
      {activeSession && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Active Session in Progress
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{activeSession.title}</h3>
              {activeSession.projectName && (
                <p className="text-xs text-zinc-400">Project: {activeSession.projectName}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Elapsed Time</span>
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {formatDuration(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-500 border-none text-white"
                  leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
                  onClick={() => setIsEndModalOpen(true)}
                >
                  End & Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Cancel this active session? Time will not be recorded.')) {
                      cancelSessionMutation.mutate(activeSession.id);
                    }
                  }}
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-zinc-900/40 border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400">Today's Total Time</span>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {formatDuration(todayDuration + (activeSession ? elapsedSeconds : 0))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900/40 border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400">Recorded Sessions</span>
              <div className="text-2xl font-bold font-mono text-zinc-100">{sessions.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions History List */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>All development sessions recorded in your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center text-xs text-zinc-500">Loading work sessions...</div>
          ) : sessions.length > 0 ? (
            <div className="divide-y divide-zinc-800/80">
              {sessions.map((session) => (
                <div key={session.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100 truncate">{session.title}</span>
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      {session.projectName && <span>Project: {session.projectName}</span>}
                      <span>Started: {formatDate(session.startedAt)}</span>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-zinc-400 mt-1 flex items-start gap-1.5 italic">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
                        <span>{session.notes}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-zinc-200">
                      {formatDuration(session.durationSeconds || 0)}
                    </span>
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
              onAction={() => setIsStartModalOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <StartSessionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />

      {activeSession && (
        <EndSessionModal
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          session={activeSession}
          elapsedSeconds={elapsedSeconds}
        />
      )}
    </div>
  );
}
