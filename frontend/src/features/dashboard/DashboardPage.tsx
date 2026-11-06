import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import {
  useActiveSession,
  useRecentSessions,
  useTodayDuration,
  useCancelSession,
} from '../../hooks/useWorkSessions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  FolderKanban,
  Play,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  Terminal,
  Square,
  X,
} from 'lucide-react';
import { formatDate, formatDuration } from '../../lib/utils';
import { StartSessionModal } from '../worklog/StartSessionModal';
import { EndSessionModal } from '../worklog/EndSessionModal';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const { data: activeSession } = useActiveSession();
  const { data: recentSessions = [] } = useRecentSessions();
  const { data: todayLoggedSeconds = 0 } = useTodayDuration();
  const cancelSessionMutation = useCancelSession();
  const navigate = useNavigate();

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer tick for active session
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

  const activeProjects = projects?.filter((p) => p.status === 'ACTIVE') || [];
  const activeCount = activeProjects.length;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Greeting section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {greeting}, {user?.displayName}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Welcome to your DevPulse control center. Ready for today's coding session?
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/projects?action=create">
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics / Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Projects Count */}
        <Card className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400">Active Projects</span>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <div className="text-2xl font-bold tracking-tight text-zinc-100">{activeCount}</div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Total registered</span>
            <span className="font-mono text-zinc-300">{projects?.length || 0}</span>
          </div>
        </Card>

        {/* Today's Logged Time */}
        <Card className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400">Today's Logged Time</span>
              <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                {formatDuration(todayLoggedSeconds + (activeSession ? elapsedSeconds : 0))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span>Work timer engine</span>
            <span className="text-[11px] font-mono text-zinc-400">
              {activeSession ? 'Session in progress' : 'Logged today'}
            </span>
          </div>
        </Card>

        {/* Weekly Productivity Placeholder */}
        <Card className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400">Weekly Dev Activity</span>
              <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">--</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span>Derived metrics</span>
            <span className="text-[11px] text-zinc-400">No mock stats</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Projects & Work Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-200">Your Active Projects</h2>
            <Link
              to="/projects"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : activeProjects.length > 0 ? (
            <div className="space-y-3">
              {activeProjects.slice(0, 4).map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 hover:border-zinc-700/80 hover:bg-zinc-850/50 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{project.name}</h4>
                      <Badge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-zinc-400 truncate max-w-lg">{project.description}</p>
                    )}
                    {project.techStack && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-500 font-mono">
                        <Terminal className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{project.techStack}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-zinc-500 block font-mono">
                      Updated {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FolderKanban className="w-6 h-6" />}
              title="No active projects"
              description="Create your first development project to start tracking your codebase progress."
              actionText="Create Project"
              onAction={() => navigate('/projects?action=create')}
            />
          )}
        </div>

        {/* Quick Action & Worklog placeholder area */}
        <div className="space-y-6">
          {/* Quick Action Area */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Rapidly launch developer tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-medium"
                leftIcon={<Plus className="w-4 h-4 text-blue-400 mr-1" />}
                onClick={() => navigate('/projects?action=create')}
              >
                Create New Project
              </Button>

              {activeSession ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Active Session
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-300">
                      {formatDuration(elapsedSeconds)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-zinc-100 truncate">{activeSession.title}</p>
                    {activeSession.projectName && (
                      <p className="text-[11px] text-zinc-400 truncate">Project: {activeSession.projectName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs justify-center bg-red-600 hover:bg-red-500 border-none text-white h-7"
                      leftIcon={<Square className="w-3 h-3 fill-current" />}
                      onClick={() => setIsEndModalOpen(true)}
                    >
                      End Session
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-zinc-400 hover:text-zinc-200 h-7 px-2"
                      title="Cancel session"
                      onClick={() => {
                        if (window.confirm('Cancel this active session? Time will not be recorded.')) {
                          cancelSessionMutation.mutate(activeSession.id);
                        }
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-medium"
                  leftIcon={<Play className="w-4 h-4 text-emerald-400 mr-1" />}
                  onClick={() => setIsStartModalOpen(true)}
                >
                  Start Dev Session (Timer)
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start text-xs font-medium opacity-80"
                leftIcon={<Calendar className="w-4 h-4 text-purple-400 mr-1" />}
                onClick={() => alert('Daily journal and markdown notes will be enabled in Phase 2.')}
              >
                Write Daily Note
              </Button>
            </CardContent>
          </Card>

          {/* Recent Work Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Work Sessions</CardTitle>
              <CardDescription>Dev tracking history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-2.5">
                  {recentSessions.slice(0, 4).map((session) => (
                    <div
                      key={session.id}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-200 truncate">{session.title}</span>
                        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                          {formatDuration(session.durationSeconds || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="truncate">{session.projectName || 'General'}</span>
                        <span>{formatDate(session.startedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Clock className="w-5 h-5" />}
                  title="No work sessions recorded"
                  description="Session tracking data model is pre-configured and ready for tracking."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
