import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from './schemas';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Activity, UserPlus } from 'lucide-react';

export function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Registration failed. Please try again.');
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
            <h2 className="text-base font-semibold text-zinc-200">Create your account</h2>
            <p className="text-xs text-zinc-400 mt-1">Start tracking your development sessions and projects</p>
          </div>

          {serverError && (
            <div className="mb-4">
              <Alert variant="error">{serverError}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              placeholder="Alex Rivers"
              error={errors.displayName?.message}
              {...register('displayName')}
            />

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
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<UserPlus className="w-4 h-4 ml-1" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
