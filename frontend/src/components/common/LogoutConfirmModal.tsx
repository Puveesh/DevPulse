import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LogOut, AlertCircle } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="top"
      className="max-w-md border-zinc-700/80 shadow-2xl"
      title={
        <div className="flex items-center gap-2.5 text-zinc-100">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-base font-semibold">Log out of DevPulse?</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            You will need to sign in again to access your DevPulse workspace, telemetry history, and daily notes.
            Any unsaved edits should be saved before logging out.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            isLoading={isLoggingOut}
            onClick={handleConfirm}
          >
            Confirm Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
