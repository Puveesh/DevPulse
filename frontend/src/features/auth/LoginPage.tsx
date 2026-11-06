import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, type LoginFormData } from './schemas';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Activity, ArrowRight, Lock } from 'lucide-react';

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

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

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      navigate(from, { replace: true });
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
          <p className="text-xs text-zinc-400">DevPulse Desktop Client</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-200">Sign in to your account</h2>
            <p className="text-xs text-zinc-400 mt-1">Enter your credentials to access your developer workspace</p>
          </div>

          {serverError && (
            <div className="mb-4">
              <Alert variant="error">{serverError}</Alert>
            </div>
          )}

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
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center text-xs text-zinc-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4">
              Create an account
            </Link>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex flex-col items-center justify-center gap-1 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Secured with Spring Security &amp; JWT</span>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono">DevPulse Desktop Client &bull; v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
