import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingSpinner({ className, message }: { className?: string; message?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-3', className)}>
      <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      {message && <p className="text-xs text-zinc-400 font-medium tracking-wide">{message}</p>}
    </div>
  );
}

