import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useProjects } from '../../hooks/useProjects';
import { useStartSession } from '../../hooks/useWorkSessions';
import { Play, FolderPlus } from 'lucide-react';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function StartSessionModal({ isOpen, onClose, defaultProjectId }: StartSessionModalProps) {
  const navigate = useNavigate();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const startSessionMutation = useStartSession();

  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [initialNotes, setInitialNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || '');
      setTitle('');
      setInitialNotes('');
      setError(null);
    }
  }, [isOpen, defaultProjectId]);

  const projectOptions = [
    { label: '-- Select a Project --', value: '' },
    ...projects.map((p) => ({ label: p.name, value: p.id })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      setError('Please select a project for this development session');
      return;
    }

    if (!title.trim()) {
      setError('Session focus title is required');
      return;
    }

    try {
      setError(null);
      await startSessionMutation.mutateAsync({
        projectId,
        title: title.trim(),
        initialNotes: initialNotes.trim() || null,
      });
      setTitle('');
      setInitialNotes('');
      setProjectId('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to start session');
      }
    }
  };

  const hasNoProjects = !isProjectsLoading && projects.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Development Session"
      description="Track focused coding time on your projects."
    >
      {hasNoProjects ? (
        <div className="space-y-4 text-center py-4">
          <p className="text-xs text-zinc-400">
            You don't have any projects registered yet. Please create a project first before starting a development session.
          </p>
          <Button
            type="button"
            variant="primary"
            leftIcon={<FolderPlus className="w-4 h-4" />}
            onClick={() => {
              onClose();
              navigate('/projects?action=create');
            }}
          >
            Create Your First Project
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Select
            label="Project"
            options={projectOptions}
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              if (error) setError(null);
            }}
            required
          />

          <Input
            label="Session Focus / Title"
            placeholder="e.g. Implement JWT filter or refactor UI"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            required
            autoFocus
          />

          <Textarea
            label="Initial Notes (Optional)"
            placeholder="Goals or context for this coding sprint..."
            rows={3}
            value={initialNotes}
            onChange={(e) => setInitialNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <Button type="button" variant="outline" onClick={onClose} disabled={startSessionMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={startSessionMutation.isPending}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              Start Timer
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
