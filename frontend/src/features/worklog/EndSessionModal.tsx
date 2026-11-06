import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useEndSession } from '../../hooks/useWorkSessions';
import { formatDuration } from '../../lib/utils';
import type { WorkSession } from '../../types';
import { Square, Clock } from 'lucide-react';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkSession;
  elapsedSeconds: number;
}

export function EndSessionModal({
  isOpen,
  onClose,
  session,
  elapsedSeconds,
}: EndSessionModalProps) {
  const endSessionMutation = useEndSession();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEnd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await endSessionMutation.mutateAsync({
        id: session.id,
        payload: {
          notes: notes.trim() || null,
        },
      });
      setNotes('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to end session');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Development Session"
      description="Record what you accomplished before concluding this session."
    >
      <form onSubmit={handleEnd} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 truncate">{session.title}</span>
            <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
          </div>
          {session.projectName && (
            <p className="text-[11px] text-zinc-400">Project: {session.projectName}</p>
          )}
        </div>

        <Textarea
          label="Summary & Notes (Optional)"
          placeholder="Key accomplishments, commits, or next steps..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
          <Button type="button" variant="outline" onClick={onClose} disabled={endSessionMutation.isPending}>
            Keep Running
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={endSessionMutation.isPending}
            leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
          >
            End & Save Session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
