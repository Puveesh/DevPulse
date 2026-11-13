import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useDeleteProject } from '../../hooks/useProjects';
import type { Project } from '../../types';
import { AlertTriangle, Trash2, Check, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AcknowledgementItem {
  id: string;
  label: string;
  description: string;
}

export const PROJECT_DELETE_ACKNOWLEDGEMENTS: AcknowledgementItem[] = [
  {
    id: 'tasks-sessions',
    label: 'Permanently delete all tasks & work sessions',
    description: 'All recorded development sessions, timers, task cards, and progress metrics will be destroyed.',
  },
  {
    id: 'daily-notes',
    label: 'Wipe all daily notes & development journals',
    description: 'All rich-text journal entries, task references, and notes created for this project will be permanently erased.',
  },
  {
    id: 'irreversible',
    label: 'Acknowledge permanent and irreversible loss',
    description: 'I understand this action cannot be undone and project data cannot be recovered or restored.',
  },
];

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  project: Project | null;
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  onSuccess,
  project,
}: DeleteProjectDialogProps) {
  const [checkedAcks, setCheckedAcks] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deleteMutation = useDeleteProject();

  // Reset checkboxes and error state whenever the dialog is opened
  useEffect(() => {
    if (isOpen) {
      setCheckedAcks(new Set());
      setErrorMsg(null);
    }
  }, [isOpen, project?.id]);

  if (!project) return null;

  const toggleAck = (id: string) => {
    setCheckedAcks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allChecked = PROJECT_DELETE_ACKNOWLEDGEMENTS.every((ack) => checkedAcks.has(ack.id));
  const remainingCount = PROJECT_DELETE_ACKNOWLEDGEMENTS.length - checkedAcks.size;

  const handleDelete = async () => {
    if (!allChecked || deleteMutation.isPending) return;

    setErrorMsg(null);
    try {
      await deleteMutation.mutateAsync(project.id);
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
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
      description="This action is destructive and irreversible."
      className="max-w-lg"
    >
      <div className="space-y-4">
        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* Danger Warning Header */}
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/20 flex items-start gap-3 text-xs text-red-200">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1 leading-relaxed">
            <p className="font-semibold text-white">
              Are you sure you want to delete <span className="text-red-400">"{project.name}"</span>?
            </p>
            <p className="text-zinc-400 text-[11px]">
              To safeguard against accidental deletion, please read and tick all required acknowledgement boxes below before proceeding.
            </p>
          </div>
        </div>

        {/* Acknowledgements Header & Counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Required Acknowledgements</span>
            </span>
            <span
              className={cn(
                'font-mono text-[11px] font-medium px-2 py-0.5 rounded-full border',
                allChecked
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              )}
            >
              {checkedAcks.size} / {PROJECT_DELETE_ACKNOWLEDGEMENTS.length} confirmed
            </span>
          </div>

          {/* Acknowledgement Checkboxes */}
          <div className="space-y-2">
            {PROJECT_DELETE_ACKNOWLEDGEMENTS.map((item) => {
              const isChecked = checkedAcks.has(item.id);
              return (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onClick={() => toggleAck(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleAck(item.id);
                    }
                  }}
                  className={cn(
                    'group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-left',
                    isChecked
                      ? 'border-red-500/50 bg-red-950/20 shadow-xs'
                      : 'border-zinc-800/90 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                      isChecked
                        ? 'border-red-500 bg-red-600 text-white'
                        : 'border-zinc-700 bg-zinc-800 group-hover:border-zinc-600 text-transparent'
                    )}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p
                      className={cn(
                        'text-xs font-semibold leading-tight transition-colors',
                        isChecked ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-200'
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidance Prompt */}
        <div className="text-[11px] px-1">
          {allChecked ? (
            <p className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 shrink-0" />
              All acknowledgements confirmed. You may now permanently delete this project.
            </p>
          ) : (
            <p className="text-amber-400/90 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Please tick the remaining {remainingCount} acknowledgement {remainingCount === 1 ? 'box' : 'boxes'} above to enable deletion.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={!allChecked || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            title={!allChecked ? 'Please tick all acknowledgement boxes to enable deletion' : undefined}
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}
