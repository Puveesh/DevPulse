import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSchema, type LoginFormData } from './schemas';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Activity, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { initiateGoogleOAuth } from './googleAuth';

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

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('message') || searchParams.get('error');
  const [serverError, setServerError] = useState<string | null>(oauthError || null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    setServerError(null);
    setIsGoogleLoading(true);
    try {
      await initiateGoogleOAuth({
        action: 'LOGIN',
        onError: (err) => {
          setServerError(err);
          setIsGoogleLoading(false);
        },
      });
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to sign in. Please verify your credentials.');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090a0f] p-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DevPulse</h1>
          <p className="text-xs text-zinc-400">Developer Worklog &amp; Analytics Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-200">Sign in to your account</h2>
            <p className="text-xs text-zinc-400 mt-1">Choose your preferred sign-in method to continue</p>
          </div>

          {serverError && (
            <div className="mb-4">
              <Alert variant="error">{serverError}</Alert>
            </div>
          )}

          {/* Options container */}
          <div className="space-y-4">
            {/* Option 1: Continue with Google */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-750 bg-zinc-800/80 hover:bg-zinc-750 text-xs font-medium text-zinc-100 transition shadow-sm hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                )}
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2.5 text-zinc-400 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Option 2: Continue with Email */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="alex@devpulse.io"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isSubmitting}
                disabled={isGoogleLoading}
                rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Sign In with Email
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center text-xs text-zinc-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Secured with Spring Security &amp; JWT</span>
        </div>
      </div>
    </div>
  );
}
