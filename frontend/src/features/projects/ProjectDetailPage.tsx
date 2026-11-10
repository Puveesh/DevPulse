import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../hooks/useProjects';
import { useProjectTasks, useUpdateTaskStatus } from '../../hooks/useTasks';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { ProjectModal } from './ProjectModal';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { TaskModal } from '../tasks/TaskModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Terminal,
  CheckSquare,
  Clock,
  FileText,
  Paperclip,
  Plus,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import { formatDate, formatDuration } from '../../lib/utils';
import type { TaskStatus } from '../../types';

function TaskPriorityBadge({ priority }: { priority: string }) {
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

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'sessions' | 'notes' | 'attachments'>('tasks');

  const { data: project, isLoading, isError, error } = useProject(id);
  const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(id);
  const updateTaskStatusMutation = useUpdateTaskStatus(id || '');

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

  const isCurrentActive = project ? isSessionActiveForProject(project.id) : false;
  const isCurrentPaused = project ? isSessionPausedForProject(project.id) : false;
  const isAnotherActive = project ? isAnotherProjectActive(project.id) : false;

  const pendingTasksCount = (tasks || []).filter(
    (t) => t.status === 'TODO' || t.status === 'IN_PROGRESS'
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-4">
        <Link to="/projects">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Projects
          </Button>
        </Link>
        <Alert variant="error" title="Project not found">
          {error instanceof Error ? error.message : 'The requested project could not be found or you do not have permission to view it.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link to="/projects">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Projects
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{project.name}</h1>
              <Badge status={project.status} />
            </div>

            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-750 transition-colors shrink-0"
            >
              <span>Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {project.techStack && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
            <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-mono text-zinc-300">{project.techStack}</span>
          </div>
        )}

        {/* Bottom row: Created & Last Activity on left, Timer Controls on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-800/80">
          {/* Left: Metadata dates */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Last activity {formatDate(project.updatedAt)}</span>
            </div>
          </div>

          {/* Right: Timer Information & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {isCurrentActive && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono font-bold text-zinc-100">
                    {formatDuration(elapsedSeconds)}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline">
                    Session in progress
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isPausing && activeSession) pauseSession(activeSession.id);
                  }}
                  disabled={isPausing}
                  title="Pause session"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 transition-colors ${
                    isPausing ? 'opacity-60 cursor-not-allowed' : 'hover:text-white hover:bg-zinc-700 cursor-pointer'
                  }`}
                >
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span>{isPausing ? 'Pausing...' : 'Pause'}</span>
                </button>

                <button
                  type="button"
                  onClick={openEndModal}
                  title="End session"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-950/50 text-red-400 hover:bg-red-900/60 border border-red-800/40 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {isCurrentPaused && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <span className="font-mono font-bold text-zinc-100">
                    {formatDuration(elapsedSeconds)}
                  </span>
                  <span className="text-[11px] text-amber-400 font-medium hidden sm:inline">
                    Paused
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isResuming && activeSession) resumeSession(activeSession.id);
                  }}
                  disabled={isResuming}
                  title="Resume session"
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 transition-colors ${
                    isResuming ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-900/60 cursor-pointer'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isResuming ? 'Resuming...' : 'Resume'}</span>
                </button>

                <button
                  type="button"
                  onClick={openEndModal}
                  title="End session"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-950/50 text-red-400 hover:bg-red-900/60 border border-red-800/40 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {!isCurrentActive && !isCurrentPaused && (
              <button
                type="button"
                onClick={() => {
                  if (!isAnotherActive) {
                    openStartModal(project.id);
                  }
                }}
                disabled={isAnotherActive}
                title={
                  isAnotherActive
                    ? `Another session (${activeSession?.projectName || 'Project'}) is active. Pause or stop it first.`
                    : 'Start development session for this project'
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isAnotherActive
                    ? 'bg-zinc-850 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-60'
                    : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-xs'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start Dev Session</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Domain Tabs: Tasks, Work Sessions, Daily Notes, Attachments */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks</span>
            {tasks && tasks.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
                {tasks.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Work Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'attachments'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'tasks' && (
          isTasksLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="w-6 h-6" />}
              title="No tasks created yet"
              description="Track features, bug fixes, and technical debt for this project."
              actionText="Add Task"
              onAction={() => setIsTaskModalOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  <span>
                    <strong className="text-zinc-200">{tasks.length}</strong>{' '}
                    {tasks.length === 1 ? 'task' : 'tasks'}
                    {' · '}
                    <strong className="text-amber-400">{pendingTasksCount}</strong> pending
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  Add Task
                </Button>
              </div>

              {taskSuccessMsg && (
                <Alert variant="success">{taskSuccessMsg}</Alert>
              )}

              <div className="space-y-3">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 hover:border-zinc-700/80 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <TaskPriorityBadge priority={task.priority} />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[11px] text-zinc-500 sm:inline hidden">Status:</label>
                          <select
                            value={task.status}
                            onChange={(e) =>
                              updateTaskStatusMutation.mutate({
                                taskId: task.id,
                                status: e.target.value as TaskStatus,
                              })
                            }
                            disabled={updateTaskStatusMutation.isPending}
                            className="px-2.5 py-1 text-xs rounded-lg border border-zinc-700/80 bg-zinc-850 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Due {formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Created {formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {activeTab === 'sessions' && (
          <EmptyState
            icon={<Clock className="w-6 h-6" />}
            title="No work sessions recorded"
            description="Work session logging with timer state validation is prepared at the schema layer."
          />
        )}

        {activeTab === 'notes' && (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No daily notes for this project"
            description="Daily journal entries and note indexing are prepared in the MySQL database."
          />
        )}

        {activeTab === 'attachments' && (
          <EmptyState
            icon={<Paperclip className="w-6 h-6" />}
            title="No attachments uploaded"
            description="Attachment metadata schema is configured. Binary file storage will connect with external object storage (S3/GCS/MinIO) in a future phase."
          />
        )}
      </div>

      {/* Edit Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        projectToEdit={project}
      />

      {/* Delete Confirmation */}
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          navigate('/projects');
        }}
        project={project}
      />

      {/* Add Task Modal */}
      {project && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          projectId={project.id}
          projectName={project.name}
          onSuccess={() => {
            setTaskSuccessMsg('Task created successfully!');
            setTimeout(() => setTaskSuccessMsg(null), 4000);
          }}
        />
      )}
    </div>
  );
}
