import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useProjects } from '../../hooks/useProjects';
import {
  FileText,
  Search,
  ArrowRight,
  Terminal,
  FolderPlus,
  Calendar,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { Project } from '../../types';

interface SelectProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SelectProjectModal({
  isOpen,
  onClose,
  title = 'Select Project for Daily Notes',
  description = 'Choose a project to view and write its daily development journal.',
}: SelectProjectModalProps) {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search when modal opens/closes
  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelectProject = (project: Project) => {
    handleClose();
    navigate(`/projects/${project.id}?tab=notes`);
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.techStack && p.techStack.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      className="max-w-xl"
    >
      <div className="space-y-4">
        {/* Search input if projects exist */}
        {projects.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search projects by name, stack, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-zinc-900/80 border-zinc-800 focus:border-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* Projects list */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-300">No projects registered yet</p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Create your first project to start keeping daily notes and tracking work sessions.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<FolderPlus className="w-4 h-4" />}
                onClick={() => {
                  handleClose();
                  navigate('/projects?action=create');
                }}
              >
                Create New Project
              </Button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500">
              No projects found matching "{searchQuery}"
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-850 hover:border-blue-500/40 transition-all cursor-pointer"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
                      {project.name}
                    </span>
                    <Badge status={project.status} />
                  </div>

                  {project.description && (
                    <p className="text-xs text-zinc-400 truncate max-w-md">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono pt-0.5">
                    {project.techStack && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <Terminal className="w-3 h-3 text-zinc-400 shrink-0" />
                        {project.techStack}
                      </span>
                    )}
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {project.lastActivity
                        ? `Activity ${formatDate(project.lastActivity)}`
                        : `Updated ${formatDate(project.updatedAt)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Open Notes <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

