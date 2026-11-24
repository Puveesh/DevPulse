import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useRecentTasks } from '../../hooks/useTasks';
import { FolderKanban, CheckSquare, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { TaskPriority, TaskStatus } from '../../types';

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          Urgent
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          High
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
          Low
        </span>
      );
    case 'MEDIUM':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Medium
        </span>
      );
  }
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          In Progress
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Cancelled
        </span>
      );
    case 'TODO':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          To Do
        </span>
      );
  }
}

export function ProjectTaskOverview() {
  const navigate = useNavigate();
  const { data: tasks, isLoading, isError, refetch } = useRecentTasks(10);

  const totalTasks = tasks?.length || 0;
  const displayedTasks = tasks ? tasks.slice(0, 3) : [];

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-200">Task Overview</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Latest development tasks across all active projects</p>
        </div>
        {totalTasks > 3 && (
          <Link
            to="/projects"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 py-1">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not load task overview.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : displayedTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No tasks found"
          description="Create tasks within your projects to track features, bugs, and milestones."
          actionText="View Projects"
          onAction={() => navigate('/projects')}
        />
      ) : (
        <div className="space-y-2.5">
          {displayedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/projects/${task.projectId}?tab=tasks`)}
              className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3 hover:border-zinc-700/80 hover:bg-zinc-850/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1 truncate text-zinc-300">
                    <FolderKanban className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{task.projectName || 'Project'}</span>
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="flex items-center gap-1 text-zinc-500 font-mono text-[10px]">
                    <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>{formatDate(task.createdAt)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
