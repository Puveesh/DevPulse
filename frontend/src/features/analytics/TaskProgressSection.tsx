import React from 'react';
import type { TaskOverview, ProjectAnalytics } from '../../types';
import { CheckCircle2, Clock, ListTodo, XCircle } from 'lucide-react';

interface TaskProgressSectionProps {
  tasks: TaskOverview;
  projects: ProjectAnalytics[];
}

export const TaskProgressSection: React.FC<TaskProgressSectionProps> = ({
  tasks,
  projects,
}) => {
  const pendingTotal = tasks.inProgressTasks + tasks.todoTasks;

  // Find project with highest number of pending tasks
  const topPendingProject = [...projects]
    .filter((p) => p.inProgressTasks + p.todoTasks > 0)
    .sort((a, b) => b.inProgressTasks + b.todoTasks - (a.inProgressTasks + a.todoTasks))[0];

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Task Progress & Completion Analysis</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deliverable throughput and backlog distribution across projects
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">Overall Completion Rate:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {tasks.overallCompletionPercentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar & Status Cards */}
      <div className="space-y-3">
        {/* Visual Multi-Segment Status Bar */}
        {tasks.totalTasks > 0 ? (
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
              {tasks.completedTasks > 0 && (
                <div
                  style={{ width: `${(tasks.completedTasks / tasks.totalTasks) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Completed: ${tasks.completedTasks}`}
                />
              )}
              {tasks.inProgressTasks > 0 && (
                <div
                  style={{ width: `${(tasks.inProgressTasks / tasks.totalTasks) * 100}%` }}
                  className="bg-blue-500 h-full transition-all"
                  title={`In Progress: ${tasks.inProgressTasks}`}
                />
              )}
              {tasks.todoTasks > 0 && (
                <div
                  style={{ width: `${(tasks.todoTasks / tasks.totalTasks) * 100}%` }}
                  className="bg-zinc-600 h-full transition-all"
                  title={`To-Do: ${tasks.todoTasks}`}
                />
              )}
              {tasks.cancelledTasks > 0 && (
                <div
                  style={{ width: `${(tasks.cancelledTasks / tasks.totalTasks) * 100}%` }}
                  className="bg-red-500/50 h-full transition-all"
                  title={`Cancelled: ${tasks.cancelledTasks}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed ({tasks.completedTasks})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                In Progress ({tasks.inProgressTasks})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                To-Do ({tasks.todoTasks})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500/50" />
                Cancelled ({tasks.cancelledTasks})
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-500">
            No tasks registered in the workspace yet.
          </div>
        )}

        {/* 4 Status KPI blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40">
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
            <div className="mt-1 text-xl font-bold font-mono text-zinc-100">{tasks.completedTasks}</div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40">
            <span className="text-[11px] text-blue-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress</span>
            </span>
            <div className="mt-1 text-xl font-bold font-mono text-zinc-100">{tasks.inProgressTasks}</div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
              <ListTodo className="w-3.5 h-3.5" />
              <span>To-Do</span>
            </span>
            <div className="mt-1 text-xl font-bold font-mono text-zinc-100">{tasks.todoTasks}</div>
          </div>

          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </span>
            <div className="mt-1 text-xl font-bold font-mono text-zinc-400">{tasks.cancelledTasks}</div>
          </div>
        </div>
      </div>

      {/* Observations Box */}
      <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/50 space-y-1.5 text-xs">
        <span className="font-semibold text-zinc-300 block">Task Observations</span>
        <div className="space-y-1 text-zinc-400">
          <p>
            • You have <strong className="text-zinc-200">{pendingTotal}</strong> tasks remaining across{' '}
            <strong className="text-zinc-200">{projects.length}</strong> registered projects.
          </p>
          {topPendingProject && (
            <p>
              • <strong className="text-blue-400">"{topPendingProject.projectName}"</strong> has the highest volume of pending items ({topPendingProject.inProgressTasks + topPendingProject.todoTasks} tasks).
            </p>
          )}
          <p>
            • Cancelled tasks are strictly excluded from completion velocity calculations ({tasks.cancelledTasks} cancelled).
          </p>
        </div>
      </div>
    </div>
  );
};

