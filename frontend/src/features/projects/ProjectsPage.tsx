import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { ProjectModal } from './ProjectModal';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Terminal,
  Clock,
  Filter,
  Play,
  Pause,
  Square,
} from 'lucide-react';
import { formatDate, formatDuration } from '../../lib/utils';
import type { Project, ProjectStatus } from '../../types';

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    activeSession,
    elapsedSeconds,
    openStartModal,
    openEndModal,
    pauseSession,
    resumeSession,
    isPausing,
    isResuming,
    isSessionActiveForProject,
    isSessionPausedForProject,
    isAnotherProjectActive,
  } = useWorkSessionContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Auto-open create modal if query parameter ?action=create is present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setProjectToEdit(null);
      setIsModalOpen(true);
      // Clean up search param
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: projects, isLoading, isError, error } = useProjects({
    search: search.trim() || undefined,
    status: statusFilter || undefined,
  });

  const handleEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setIsModalOpen(true);
  };

  const handleDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const statusOptions: { label: string; value: ProjectStatus | '' }[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your codebases, microservices, and applications.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          New Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
            className="h-9 w-full sm:w-44 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/80"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="error" title="Could not load projects">
          {error instanceof Error ? error.message : 'An error occurred fetching project list.'}
        </Alert>
      )}

      {/* Projects List/Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all cursor-pointer shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-100 text-base group-hover:text-blue-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <Badge status={project.status} />
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>

                {project.techStack && (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{project.techStack}</span>
                  </div>
                )}
              </div>

              {/* Bottom footer container with compact timer control */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-3">
                {/* Inline Compact Development Session Timer Control */}
                {(() => {
                  const isCurrentActive = isSessionActiveForProject(project.id);
                  const isCurrentPaused = isSessionPausedForProject(project.id);
                  const isAnotherActive = isAnotherProjectActive(project.id);

                  return (
                    <div
                      className="flex items-center justify-between text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isCurrentActive ? (
                        // State B: Active session belongs to this project
                        <>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                              Running
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {formatDuration(elapsedSeconds)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeSession) pauseSession(activeSession.id);
                              }}
                              disabled={isPausing}
                              title="Pause session"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                              <Pause className="w-3 h-3 text-amber-400" />
                              <span>Pause</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEndModal();
                              }}
                              title="End session"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-950/50 text-red-400 hover:bg-red-900/60 border border-red-800/40 transition-colors cursor-pointer"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          </div>
                        </>
                      ) : isCurrentPaused ? (
                        // State C: Session is paused for this project
                        <>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                              Paused
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-200">
                              {formatDuration(elapsedSeconds)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeSession) resumeSession(activeSession.id);
                              }}
                              disabled={isResuming}
                              title="Resume session"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-800/40 transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Resume</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEndModal();
                              }}
                              title="End session"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-950/50 text-red-400 hover:bg-red-900/60 border border-red-800/40 transition-colors cursor-pointer"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        // State A: No active session for this project
                        <>
                          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            <span>Dev Timer</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAnotherActive) {
                                openStartModal(project.id);
                              }
                            }}
                            disabled={isAnotherActive}
                            title={
                              isAnotherActive
                                ? `A development session is active for "${activeSession?.projectName || 'another project'}"`
                                : 'Start development session for this project'
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                              isAnotherActive
                                ? 'bg-zinc-800/40 text-zinc-500 border border-zinc-800/80 cursor-not-allowed opacity-60'
                                : 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/30 hover:border-blue-500/50 cursor-pointer'
                            }`}
                          >
                            <Play className={`w-3 h-3 ${isAnotherActive ? 'text-zinc-600' : 'fill-current'}`} />
                            <span>Start</span>
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Project Metadata & Actions */}
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800/40">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
                        title="Open repository"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleEdit(project, e)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                      title="Edit project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project, e)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderKanban className="w-7 h-7" />}
          title={search || statusFilter ? 'No matching projects found' : 'No projects yet'}
          description={
            search || statusFilter
              ? 'Try modifying your search query or status filter.'
              : 'Add your first project to organize your development worklogs and tasks.'
          }
          actionText={search || statusFilter ? 'Clear Filters' : 'Create Project'}
          onAction={() => {
            if (search || statusFilter) {
              setSearch('');
              setStatusFilter('');
            } else {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }
          }}
        />
      )}

      {/* Create / Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectToEdit(null);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        project={projectToDelete}
      />
    </div>
  );
}

