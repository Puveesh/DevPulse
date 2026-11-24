import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  FolderKanban,
  CheckSquare,
  Clock,
  FileText,
  Paperclip,
  User,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

const DATA_DELETION_ITEMS = [
  {
    icon: <User className="w-4 h-4 text-red-400" />,
    title: 'User Profile & Credentials',
    desc: 'Authentication credentials, developer identity, bio, and preferences.',
  },
  {
    icon: <FolderKanban className="w-4 h-4 text-amber-400" />,
    title: 'All Projects & Metadata',
    desc: 'Every registered project, tech stack configuration, and repository link.',
  },
  {
    icon: <CheckSquare className="w-4 h-4 text-blue-400" />,
    title: 'All Tasks & Milestones',
    desc: 'Every task card, priority tag, status, and due date.',
  },
  {
    icon: <Clock className="w-4 h-4 text-emerald-400" />,
    title: 'Work Sessions & Timers',
    desc: 'Recorded work logs, duration metrics, active timers, and pause intervals.',
  },
  {
    icon: <FileText className="w-4 h-4 text-purple-400" />,
    title: 'Daily Notes & Journal Entries',
    desc: 'All rich-text development logs, task mentions, and session notes.',
  },
  {
    icon: <Paperclip className="w-4 h-4 text-zinc-400" />,
    title: 'Attachments & Documents',
    desc: 'File attachments, document metadata, and associated artifacts.',
  },
];

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { deleteAccount } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState('');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPassword('');
      setConfirmationInput('');
      setIsDeleting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const isConfirmationPhraseValid = confirmationInput.trim() === CONFIRMATION_PHRASE;
  const isPasswordEntered = password.trim().length > 0;
  const canSubmit = isConfirmationPhraseValid && isPasswordEntered && !isDeleting;

  const handleDeleteAccount = async () => {
    if (!canSubmit) return;

    setErrorMsg(null);
    setIsDeleting(true);

    try {
      await deleteAccount({
        password: password.trim(),
        confirmation: confirmationInput.trim(),
      });
      // Auth context clears state and navigates to login
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to permanently delete account. Please verify your password.');
      }
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>Permanently Delete Developer Account</span>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
          <span className="font-medium text-zinc-400">
            Step {step} of 3:{' '}
            <strong className="text-zinc-200">
              {step === 1 && 'Critical Warning'}
              {step === 2 && 'Data Deletion Breakdown'}
              {step === 3 && 'Final Verification'}
            </strong>
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                step >= 1 ? 'bg-red-500' : 'bg-zinc-700'
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                step >= 2 ? 'bg-red-500' : 'bg-zinc-700'
              }`}
            />
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                step === 3 ? 'bg-red-500' : 'bg-zinc-700'
              }`}
            />
          </div>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* STEP 1: WARNING */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-red-300">
                    Are you absolutely sure you want to proceed?
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    This action is <strong className="text-red-400">immediate and irreversible</strong>. Once
                    your account is deleted, all associated data across the DevPulse database will be permanently
                    wiped. No backups can be recovered.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 space-y-2">
              <p>
                Permanent account deletion complies with developer data ownership standards. Your UUID context,
                relational tables, and files will be unlinked and purged from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setStep(2)}
              >
                Review Data To Be Erased
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: DATA BREAKDOWN */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300">
              The following data linked to your developer account will be <strong className="text-red-400">permanently destroyed</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {DATA_DELETION_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 flex items-start gap-2.5"
                >
                  <div className="p-1.5 rounded bg-zinc-800/80 shrink-0 mt-0.5">{item.icon}</div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-zinc-200 truncate">{item.title}</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setStep(3)}
              >
                Proceed to Verification
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: FINAL VERIFICATION */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-950/20 text-xs text-red-300 leading-relaxed">
              To prevent accidental deletion, re-enter your current password and type{' '}
              <span className="font-mono font-bold text-red-200 bg-red-900/40 px-1.5 py-0.5 rounded select-all border border-red-500/30">
                {CONFIRMATION_PHRASE}
              </span>{' '}
              below.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Account Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter your current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Type <span className="font-mono text-red-400">{CONFIRMATION_PHRASE}</span> to confirm <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={CONFIRMATION_PHRASE}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => setStep(2)}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                isLoading={isDeleting}
                disabled={!canSubmit}
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-500 font-semibold"
              >
                Permanently Delete My Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
