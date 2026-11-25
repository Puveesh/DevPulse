import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeGoogleTicket } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  useEffect(() => {
    const processCallback = async () => {
      const ticket = searchParams.get('ticket');
      const state = searchParams.get('state');
      const action = searchParams.get('action');
      const oauthError = searchParams.get('error');
      const oauthMessage = searchParams.get('message');

      if (oauthError || oauthMessage) {
        setIsProcessing(false);
        setError(oauthMessage || `Authentication error: ${oauthError}`);
        return;
      }

      if (!ticket || !state) {
        setIsProcessing(false);
        setError('Missing authentication ticket or state parameter from OAuth callback.');
        return;
      }

      try {
        await exchangeGoogleTicket(ticket, state);
        if (action === 'LINK') {
          navigate('/settings', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        setIsProcessing(false);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to exchange authentication ticket with DevPulse backend.');
        }
      }
    };

    processCallback();
  }, [searchParams, exchangeGoogleTicket, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090a0f] p-4 text-zinc-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DevPulse</h1>
          <p className="text-xs text-zinc-400">Authenticating with Google</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl text-center space-y-4">
          {isProcessing && (
            <div className="py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm text-zinc-300 font-medium">Completing secure authentication...</p>
              <p className="text-xs text-zinc-500">Verifying single-use ticket and establishing developer session</p>
            </div>
          )}

          {error && (
            <div className="space-y-4 text-left">
              <Alert variant="error">{error}</Alert>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Return to Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/register', { replace: true })}
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
