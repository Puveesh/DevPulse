import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useEndSession } from '../../hooks/useWorkSessions';
import { formatDuration, formatTime } from '../../lib/utils';
import type { WorkSession } from '../../types';
import { Square, Clock, FolderKanban } from 'lucide-react';

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
  const [sessionNotes, setSessionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startTimeFormatted = formatTime(session.startedAt);
  const currentTimeFormatted = formatTime(new Date().toISOString());

  const handleEnd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await endSessionMutation.mutateAsync({
        id: session.id,
        payload: {
          sessionNotes: sessionNotes.trim() || null,
          endedAt: new Date().toISOString(),
        },
      });
      setSessionNotes('');
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
      title="End Development Session"
      description="Review session details and record wrap-up notes before saving."
    >
      <form onSubmit={handleEnd} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Session Summary Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-zinc-100">
                {session.projectName || 'Project'}
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Title / Focus:</span>
              <span className="font-medium text-zinc-200">{session.title}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Start Time:</span>
              <span className="font-mono text-zinc-300">{startTimeFormatted}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>End Time:</span>
              <span className="font-mono text-zinc-300">{currentTimeFormatted}</span>
            </div>
          </div>

          {session.initialNotes && (
            <div className="pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-500 block mb-0.5">Initial Notes:</span>
              <p className="text-zinc-400 italic bg-zinc-950/40 p-2 rounded border border-zinc-850">
                {session.initialNotes}
              </p>
            </div>
          )}
        </div>

        {/* Session End Notes */}
        <Textarea
          label="Session Notes"
          placeholder="- Implemented feature...&#10;- Fixed bug...&#10;- Tested integration..."
          rows={4}
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          autoFocus
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={endSessionMutation.isPending}
          >
            Keep Session Running
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
