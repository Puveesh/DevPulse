import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useProjectTaskSummary } from '../../hooks/useTasks';
import { FolderKanban, CheckSquare, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ProjectTaskOverview() {
  const navigate = useNavigate();
  const { data: summary, isLoading, isError } = useProjectTaskSummary();

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-200">Project Task Overview</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Quick tracking of pending tasks across codebases</p>
        </div>
        <Link
          to="/projects"
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-1">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Could not load project task overview.</span>
        </div>
      ) : !summary || summary.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No projects found"
          description="Create a project to start assigning and tracking tasks."
          actionText="Create Project"
          onAction={() => navigate('/projects?action=create')}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4 text-right">Pending Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {summary.map((project) => (
                <tr
                  key={project.projectId}
                  onClick={() => navigate(`/projects/${project.projectId}`)}
                  className="hover:bg-zinc-850/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-medium text-zinc-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderKanban className="w-4 h-4 text-blue-400 shrink-0 group-hover:text-blue-300 transition-colors" />
                      <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md font-medium text-zinc-100">
                        {project.projectName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right shrink-0">
                    {project.pendingTaskCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {project.pendingTaskCount}{' '}
                        {project.pendingTaskCount === 1 ? 'issue pending' : 'issues pending'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        No pending issues
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

