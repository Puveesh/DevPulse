import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../hooks/useProjects';
import { ProjectModal } from './ProjectModal';
import { DeleteProjectDialog } from './DeleteProjectDialog';
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
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'sessions' | 'notes' | 'attachments'>('tasks');

  const { data: project, isLoading, isError, error } = useProject(id);

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

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-zinc-800/80 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Last activity {formatDate(project.updatedAt)}</span>
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
          <EmptyState
            icon={<CheckSquare className="w-6 h-6" />}
            title="No tasks created yet"
            description="The task entity and database schema are ready in the backend. Task board features will be available in the next release."
          />
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
    </div>
  );
}
