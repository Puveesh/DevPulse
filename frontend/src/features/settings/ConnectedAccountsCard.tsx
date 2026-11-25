import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { Link2, Unlink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { initiateGoogleOAuth } from '../auth/googleAuth';

function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface ConnectedAccountsCardProps {
  onNotify?: (notification: { type: 'success' | 'error'; title: string; message: string }) => void;
}

export function ConnectedAccountsCard({ onNotify }: ConnectedAccountsCardProps) {
  const { user, unlinkGoogle } = useAuth();
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isGoogleConnected = !!user?.googleLinked;
  const connectedEmail = user?.googleEmail || user?.email;
  const hasPassword = !!user?.hasPassword;

  const handleConnectGoogle = async () => {
    setErrorMessage(null);
    setIsLinking(true);
    try {
      await initiateGoogleOAuth({
        action: 'LINK',
        onError: (err) => {
          setErrorMessage(err);
          setIsLinking(false);
        },
      });
    } catch {
      setIsLinking(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    setIsUnlinking(true);
    setErrorMessage(null);
    try {
      await unlinkGoogle();
      setIsDisconnectModalOpen(false);
      onNotify?.({
        type: 'success',
        title: 'Account Disconnected',
        message: 'Google identity has been disconnected from your DevPulse account.',
      });
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to disconnect Google account.');
      }
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <>
      <Card className="border-zinc-800/80 bg-zinc-900/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-400" />
            <CardTitle>Connected Accounts</CardTitle>
          </div>
          <CardDescription>
            Manage external identity providers and Single Sign-On (SSO) credentials linked to your developer account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="mb-2">
              <Alert variant="error">{errorMessage}</Alert>
            </div>
          )}

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 divide-y divide-zinc-850">
            {/* Google Provider Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg border border-zinc-700/60 bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                  <GoogleIcon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">Google Account</span>
                    {isGoogleConnected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Not connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {isGoogleConnected ? (
                      <span>
                        Connected email:{' '}
                        <span className="font-mono text-zinc-200">{connectedEmail}</span>
                      </span>
                    ) : (
                      'Link your Google account to log in with one click via Google SSO.'
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                {isGoogleConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="border-zinc-700 hover:border-red-500/50 hover:bg-red-950/20 hover:text-red-300 text-zinc-300"
                    leftIcon={<Unlink className="w-3.5 h-3.5 text-zinc-400" />}
                  >
                    Disconnect Google Account
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleConnectGoogle}
                      isLoading={isLinking}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm"
                      leftIcon={isLinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GoogleIcon className="w-3.5 h-3.5" />}
                    >
                      {isLinking ? 'Connecting...' : 'Connect Google Account'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Explanatory rules footnote */}
            <div className="pt-3 text-[11px] text-zinc-400 leading-relaxed">
              <p>
                {isGoogleConnected
                  ? 'You can sign into DevPulse using either your email/password or Continue with Google. Both methods securely resolve to this exact developer workspace.'
                  : 'DevPulse never automatically merges accounts based on email address. To connect Google, authenticate with your existing credentials and authorize Google.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Google Confirmation Modal */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title="Disconnect Google Account"
      >
        <div className="space-y-4 text-xs text-zinc-300">
          {!hasPassword ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex gap-2 text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Password Required Before Disconnecting</span>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    This account was created exclusively through Google and currently has no password configured.
                    You must first configure a password in the Password Management section below before you can disconnect your Google account, otherwise you would be locked out of DevPulse.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setIsDisconnectModalOpen(false)}>
                  Understood
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                Are you sure you want to disconnect Google account <strong className="text-zinc-100 font-mono">{connectedEmail}</strong>?
              </p>
              <p className="text-zinc-400">
                After disconnecting, you will no longer be able to sign in using Continue with Google unless you reconnect it later. You can continue signing in using your email and password.
              </p>
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDisconnectModalOpen(false)}
                  disabled={isUnlinking}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDisconnect}
                  isLoading={isUnlinking}
                >
                  Disconnect Google
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
