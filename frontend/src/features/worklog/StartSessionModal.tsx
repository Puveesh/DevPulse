import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useProjects } from '../../hooks/useProjects';
import { useStartSession } from '../../hooks/useWorkSessions';
import { Play } from 'lucide-react';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function StartSessionModal({ isOpen, onClose, defaultProjectId }: StartSessionModalProps) {
  const { data: projects = [] } = useProjects();
  const startSessionMutation = useStartSession();

  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const projectOptions = [
    { label: 'General / No Project', value: '' },
    ...projects.map((p) => ({ label: p.name, value: p.id })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Session title is required');
      return;
    }

    try {
      setError(null);
      await startSessionMutation.mutateAsync({
        projectId: projectId || null,
        title: title.trim(),
        notes: notes.trim() || null,
      });
      setTitle('');
      setNotes('');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Development Session"
      description="Track focused coding time on your projects."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="Project (Optional)"
          options={projectOptions}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />

        <Input
          label="Session Focus / Title"
          placeholder="e.g. Implement JWT filter or refactor UI"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Textarea
          label="Initial Notes (Optional)"
          placeholder="Goals or context for this coding sprint..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
    </Modal>
  );
}
