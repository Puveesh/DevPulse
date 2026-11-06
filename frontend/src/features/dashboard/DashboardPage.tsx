import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
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
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();

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

        {/* Today's Logged Time Placeholder */}
        <Card className="relative overflow-hidden border-zinc-800/90 bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400">Today's Logged Time</span>
              <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">00:00:00</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
            <span>Work timer engine</span>
            <span className="text-[11px] font-mono text-zinc-400">Phase 2 integration</span>
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
              <Button
                variant="outline"
                className="w-full justify-start text-xs font-medium opacity-80"
                leftIcon={<Play className="w-4 h-4 text-emerald-400 mr-1" />}
                onClick={() => alert('Work session timer engine will be available in Phase 2.')}
              >
                Start Dev Session (Timer)
              </Button>
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

          {/* Recent Work Sessions Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Work Sessions</CardTitle>
              <CardDescription>Dev tracking history</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Clock className="w-5 h-5" />}
                title="No work sessions recorded"
                description="Session tracking data model is pre-configured and ready for tracking."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
