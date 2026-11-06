import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className, ...props }: AlertProps) {
  const configs = {
    info: {
      border: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
    },
    success: {
      border: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    },
    error: {
      border: 'border-red-500/30 bg-red-500/10 text-red-300',
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
    },
  };

  const current = configs[variant];

  return (
    <div
      className={cn('flex items-start gap-3 rounded-lg border p-3.5 text-sm', current.border, className)}
      role="alert"
      {...props}
    >
      {current.icon}
      <div className="space-y-0.5">
        {title && <h5 className="font-medium tracking-tight text-zinc-100">{title}</h5>}
        <div className="text-xs text-zinc-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

