import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { useProjects } from '../../hooks/useProjects';
import { useWorkSessions } from '../../hooks/useWorkSessions';
import { useTodayAnalytics, useWeeklyAnalytics } from '../../hooks/useAnalytics';
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
  Pause,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  Terminal,
  Square,
  FileText,
} from 'lucide-react';
import { formatDate, formatDuration, formatTime, formatDurationHoursMinutes } from '../../lib/utils';
import { SessionDetailModal } from '../worklog/SessionDetailModal';
import { WeeklyActivityChart } from './WeeklyActivityChart';
import { WeeklyStatisticsModal } from './WeeklyStatisticsModal';
import { TodayWorklogModal } from './TodayWorklogModal';
import { ProjectTaskOverview } from './ProjectTaskOverview';
import { SelectProjectModal } from './SelectProjectModal';
import type { WorkSession } from '../../types';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects();
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
  const { data: sessionsData } = useWorkSessions(0, 10);
  const { data: todayData, isLoading: isTodayLoading } = useTodayAnalytics();
  const { data: weeklyData, isLoading: isWeeklyLoading } = useWeeklyAnalytics();
  const navigate = useNavigate();

  const [selectedDetailSession, setSelectedDetailSession] = useState<WorkSession | null>(null);
  const [isWeeklyStatsModalOpen, setIsWeeklyStatsModalOpen] = useState(false);
  const [isTodayWorklogModalOpen, setIsTodayWorklogModalOpen] = useState(false);
  const [isSelectProjectModalOpen, setIsSelectProjectModalOpen] = useState(false);

  const activeProjects = projects?.filter((p) => p.status === 'ACTIVE') || [];
  const activeCount = activeProjects.length;
  const completedSessions = (sessionsData?.content || []).filter((s) => s.status === 'COMPLETED');

  // Real-time continuous ticking for active session without constant polling
  const liveActiveExtra =
    activeSession && activeSession.status === 'ACTIVE'
      ? Math.max(0, elapsedSeconds - (todayData?.activeSessionTodayWorkingSeconds || 0))
      : 0;

  const liveTodaySeconds = (todayData?.totalDurationSeconds || 0) + liveActiveExtra;

  // Real-time project breakdown
  const projectBreakdown = useMemo(() => {
    if (!todayData?.projects || todayData.projects.length === 0) {
      if (activeSession && liveTodaySeconds > 0) {
        return [
          {
            projectId: activeSession.projectId || null,
            projectName: activeSession.projectName || 'General Development',
            durationSeconds: liveTodaySeconds,
          },
        ];
      }
      return [];
    }
    const list = todayData.projects.map((p) => ({ ...p }));
    if (activeSession && activeSession.status === 'ACTIVE' && liveActiveExtra > 0) {
      const activeProjName = activeSession.projectName || 'General Development';
      const existing = list.find(
        (p) =>
          (activeSession.projectId && p.projectId === activeSession.projectId) ||
          p.projectName === activeProjName
      );
      if (existing) {
        existing.durationSeconds += liveActiveExtra;
      } else {
        list.push({
          projectId: activeSession.projectId || null,
          projectName: activeProjName,
          durationSeconds: liveActiveExtra,
        });
      }
    }
    return list.sort((a, b) => b.durationSeconds - a.durationSeconds);
  }, [todayData?.projects, activeSession, liveActiveExtra, liveTodaySeconds]);

  // Live weekly total & daily distribution
  const liveWeeklyExtra =
    activeSession && activeSession.status === 'ACTIVE'
      ? Math.max(0, elapsedSeconds - (weeklyData?.activeSessionWeeklyWorkingSeconds || 0))
      : 0;

  const liveWeeklySeconds = (weeklyData?.totalDurationSeconds || 0) + liveWeeklyExtra;

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const weeklyDailyActivity = useMemo(() => {
    if (!weeklyData?.dailyActivity) return [];
    return weeklyData.dailyActivity.map((d) => {
      if (d.date === todayStr && liveWeeklyExtra > 0) {
        return {
          ...d,
          durationSeconds: d.durationSeconds + liveWeeklyExtra,
        };
      }
      return d;
    });
  }, [weeklyData?.dailyActivity, todayStr, liveWeeklyExtra]);

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
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
            onClick={() => setIsSelectProjectModalOpen(true)}
          >
            Daily Notes
          </Button>
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
        <Card
          onClick={() => navigate('/projects')}
          className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40 flex flex-col justify-between cursor-pointer hover:border-zinc-700/80 hover:bg-zinc-850/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                Active Projects
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <div className="text-2xl font-bold tracking-tight text-zinc-100">{activeCount}</div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:border-blue-500/40 transition-colors">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
            <span>Total registered</span>
            <span className="font-mono text-zinc-300">{projects?.length || 0}</span>
          </div>
        </Card>

        {/* Today's Logged Time */}
        <Card
          onClick={() => setIsTodayWorklogModalOpen(true)}
          className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40 flex flex-col justify-between cursor-pointer hover:border-zinc-700/80 hover:bg-zinc-850/50 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Today's Logged Time
                </span>
                {isTodayLoading ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                    {formatDuration(liveTodaySeconds)}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:border-amber-500/40 transition-colors">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {liveTodaySeconds > 0 && projectBreakdown.length > 0 && (
              <div className="mt-3 space-y-1">
                {projectBreakdown.slice(0, 2).map((p) => (
                  <div key={p.projectName} className="flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[140px] text-zinc-300 font-medium">
                      {p.projectName}
                    </span>
                    <span className="font-mono text-zinc-400">
                      {formatDurationHoursMinutes(p.durationSeconds)}
                    </span>
                  </div>
                ))}
                {projectBreakdown.length > 2 && (
                  <div className="text-[10px] text-zinc-500 text-right">
                    +{projectBreakdown.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            {liveTodaySeconds === 0 ? (
              <>
                <span>Today's summary</span>
                <span className="text-[11px] text-zinc-400 italic">No development time logged today.</span>
              </>
            ) : (
              <>
                <span>
                  {todayData?.sessionCount || (activeSession ? 1 : 0)}{' '}
                  {(todayData?.sessionCount || (activeSession ? 1 : 0)) === 1 ? 'session' : 'sessions'}
                </span>
                <span className="font-mono text-zinc-300">
                  {projectBreakdown.length} {projectBreakdown.length === 1 ? 'project' : 'projects'}
                </span>
              </>
            )}
          </div>
        </Card>

        {/* Weekly Dev Activity */}
        <Card
          onClick={() => setIsWeeklyStatsModalOpen(true)}
          className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40 flex flex-col justify-between cursor-pointer hover:border-zinc-700/80 hover:bg-zinc-850/50 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Weekly Dev Activity
                </span>
                {isWeeklyLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                    {formatDurationHoursMinutes(liveWeeklySeconds)}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-2.5 h-[64px] w-full pointer-events-none">
              {isWeeklyLoading ? (
                <Skeleton className="h-[64px] w-full" />
              ) : (
                <WeeklyActivityChart
                  dailyActivity={weeklyDailyActivity}
                  todayDate={todayStr}
                />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Most active:{' '}
              <span className="text-zinc-300 font-medium font-sans">
                {weeklyData?.mostActiveDay || (liveWeeklySeconds > 0 ? 'Today' : '--')}
              </span>
            </span>
            <span className="font-mono text-zinc-300">
              {weeklyData?.activeDays || (liveWeeklySeconds > 0 ? 1 : 0)}/7 days
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Projects & Work Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List & Project Task Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
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

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}?tab=notes`);
                        }}
                        title={`Open Daily Notes for ${project.name}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800/80 hover:bg-zinc-750 text-blue-400 hover:text-blue-300 border border-zinc-750 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Daily Notes</span>
                      </button>
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

          {/* Project Task Overview directly below Active Projects */}
          <ProjectTaskOverview />
        </div>

        {/* Quick Action & Worklog area */}
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
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider">
                      {activeSession.status === 'ACTIVE' ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-emerald-400">Active Session</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                          <span className="text-amber-400">Session Paused</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-sm font-bold text-white tracking-wider">
                      {formatDuration(elapsedSeconds)}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-zinc-100 truncate">{activeSession.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="truncate">{activeSession.projectName}</span>
                      <span>Started {formatTime(activeSession.startedAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {activeSession.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs justify-center"
                        leftIcon={<Pause className="w-3.5 h-3.5 text-amber-400" />}
                        isLoading={isPausing}
                        onClick={() => pauseSession(activeSession.id)}
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs justify-center"
                        leftIcon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
                        isLoading={isResuming}
                        onClick={() => resumeSession(activeSession.id)}
                      >
                        Resume
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs justify-center bg-red-600 hover:bg-red-500 border-none text-white"
                      leftIcon={<Square className="w-3 h-3 fill-current" />}
                      onClick={openEndModal}
                    >
                      End Session
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-medium"
                  leftIcon={<Play className="w-4 h-4 text-emerald-400 mr-1" />}
                  onClick={() => openStartModal()}
                >
                  Start Dev Session (Timer)
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start text-xs font-medium"
                leftIcon={<FileText className="w-4 h-4 text-purple-400 mr-1" />}
                onClick={() => setIsSelectProjectModalOpen(true)}
              >
                Daily Notes
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
              {completedSessions.length > 0 ? (
                <div className="space-y-2.5">
                  {completedSessions.slice(0, 4).map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedDetailSession(session)}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3 space-y-1 hover:border-zinc-700/80 hover:bg-zinc-850/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-200 truncate">{session.title}</span>
                        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                          {formatDuration(session.totalDurationSeconds || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="truncate">{session.projectName}</span>
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

      {/* Session Details Modal */}
      <SessionDetailModal
        isOpen={!!selectedDetailSession}
        onClose={() => setSelectedDetailSession(null)}
        session={selectedDetailSession}
      />

      {/* Expanded Today Worklogs Modal */}
      <TodayWorklogModal
        isOpen={isTodayWorklogModalOpen}
        onClose={() => setIsTodayWorklogModalOpen(false)}
        onSelectSessionForDetails={(session) => {
          setSelectedDetailSession(session);
        }}
      />

      {/* Expanded Weekly Statistics Modal */}
      <WeeklyStatisticsModal
        isOpen={isWeeklyStatsModalOpen}
        onClose={() => setIsWeeklyStatsModalOpen(false)}
      />

      {/* Select Project for Daily Notes Modal */}
      <SelectProjectModal
        isOpen={isSelectProjectModalOpen}
        onClose={() => setIsSelectProjectModalOpen(false)}
      />
    </div>
  );
}
