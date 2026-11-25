import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Lock, KeyRound, Eye, EyeOff, Info } from 'lucide-react';

interface ChangePasswordCardProps {
  onNotify?: (notification: { type: 'success' | 'error'; title: string; message: string }) => void;
}

export function ChangePasswordCard({ onNotify }: ChangePasswordCardProps) {
  const { user, changePassword, setPassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasPassword = !!user?.hasPassword;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setIsExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (hasPassword && !currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    if (hasPassword && currentPassword === newPassword) {
      setErrorMessage('New password cannot be identical to your current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasPassword) {
        await changePassword({ currentPassword, newPassword, confirmPassword });
        onNotify?.({
          type: 'success',
          title: 'Password Changed',
          message: 'Your account password has been updated successfully.',
        });
      } else {
        await setPassword({ newPassword, confirmPassword });
        onNotify?.({
          type: 'success',
          title: 'Password Configured',
          message: 'Your password has been set. You can now log in using email/password or Google.',
        });
      }
      resetForm();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to update password. Please check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-zinc-800/80 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <CardTitle>{hasPassword ? 'Change Password' : 'Set Account Password'}</CardTitle>
          </div>
          <CardDescription>
            {hasPassword
              ? 'Update your email and password credentials for signing in to DevPulse'
              : 'Add an email/password authentication method to your Google-created account'}
          </CardDescription>
        </div>

        {!isExpanded ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
            leftIcon={<KeyRound className="w-3.5 h-3.5" />}
          >
            {hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* If collapsed, show informational status badge */}
        {!isExpanded && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Password Authentication</span>
                <span className="text-zinc-400">
                  {hasPassword
                    ? 'Active (hashed with BCrypt and validated on credential check)'
                    : 'Not configured (Google SSO account)'}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                hasPassword
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {hasPassword ? 'Configured' : 'Google-Only'}
            </span>
          </div>
        )}

        {/* If expanded, show password form */}
        {isExpanded && (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {!hasPassword && (
              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/20 flex gap-2 text-xs text-blue-200">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Your DevPulse account was created via Google. Setting a password allows you to sign in with either your email and password or Continue with Google.
                </p>
              </div>
            )}

            {errorMessage && (
              <Alert variant="error">{errorMessage}</Alert>
            )}

            {/* Current Password (only if user already has one) */}
            {hasPassword && (
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-200"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                size="sm"
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
              >
                {hasPassword ? 'Save Password Changes' : 'Set Password'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
