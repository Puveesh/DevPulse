import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useDeleteProject } from '../../hooks/useProjects';
import type { Project } from '../../types';

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function DeleteProjectDialog({ isOpen, onClose, project }: DeleteProjectDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deleteMutation = useDeleteProject();

  if (!project) return null;

  const handleDelete = async () => {
    setErrorMsg(null);
    try {
      await deleteMutation.mutateAsync(project.id);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to delete the project.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      description="This action cannot be undone."
      className="max-w-md"
    >
      <div className="space-y-4">
        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        <p className="text-xs text-zinc-300 leading-relaxed">
          Are you sure you want to delete project <strong className="text-white">"{project.name}"</strong>?
          All associated tasks, work sessions, and metadata will be permanently removed.
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}

