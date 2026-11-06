import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useUpdateSessionNotes } from '../../hooks/useWorkSessions';
import { formatDate, formatTime, formatDuration } from '../../lib/utils';
import type { WorkSession } from '../../types';
import { FolderKanban, Calendar, Clock, Edit3, Check, FileText } from 'lucide-react';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkSession | null;
}

export function SessionDetailModal({ isOpen, onClose, session }: SessionDetailModalProps) {
  const updateNotesMutation = useUpdateSessionNotes();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setNotesText(session.sessionNotes || '');
      setIsEditingNotes(false);
      setStatusMessage(null);
      setError(null);
    }
  }, [session]);

  if (!session) return null;

  const handleSaveNotes = async () => {
    try {
      setError(null);
      await updateNotesMutation.mutateAsync({
        id: session.id,
        payload: { sessionNotes: notesText },
      });
      setIsEditingNotes(false);
      setStatusMessage('Session notes updated successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update notes');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Details"
      description="Review development log and session history."
    >
      <div className="space-y-4">
        {statusMessage && <Alert variant="success">{statusMessage}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Metadata Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-zinc-100">
                {session.projectName || 'Project'}
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {formatDuration(session.totalDurationSeconds || 0)}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Focus / Title:</span>
              <span className="font-semibold text-zinc-100 text-right">{session.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Date:
              </span>
              <span className="text-zinc-200">{formatDate(session.startedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" /> Time Window:
              </span>
              <span className="font-mono text-zinc-300">
                {formatTime(session.startedAt)} &rarr; {session.endedAt ? formatTime(session.endedAt) : 'In progress'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Status:</span>
              <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                {session.status}
              </span>
            </div>
          </div>

          {session.initialNotes && (
            <div className="pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-400 font-medium block mb-1">Initial Notes (Start):</span>
              <p className="text-zinc-300 italic bg-zinc-950/50 p-2.5 rounded border border-zinc-850">
                {session.initialNotes}
              </p>
            </div>
          )}
        </div>

        {/* Session End Notes Section with Edit Capability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Session End Notes & Remarks
            </label>
            {!isEditingNotes && (
              <button
                type="button"
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Notes
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                rows={4}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add or update session notes..."
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotesText(session.sessionNotes || '');
                    setIsEditingNotes(false);
                  }}
                  disabled={updateNotesMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveNotes}
                  isLoading={updateNotesMutation.isPending}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Save Remarks
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 min-h-[60px] whitespace-pre-wrap">
              {session.sessionNotes ? (
                session.sessionNotes
              ) : (
                <span className="text-zinc-500 italic">No wrap-up remarks recorded for this session.</span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800/80">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

