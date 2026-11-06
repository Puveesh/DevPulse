import React from 'react';
import { cn } from '../../lib/utils';
import type { ProjectStatus } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'active' | 'on_hold' | 'completed' | 'archived' | 'outline';
  status?: ProjectStatus;
}

export function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  let computedVariant = variant || 'default';

  if (status) {
    switch (status) {
      case 'ACTIVE':
        computedVariant = 'active';
        break;
      case 'ON_HOLD':
        computedVariant = 'on_hold';
        break;
      case 'COMPLETED':
        computedVariant = 'completed';
        break;
      case 'ARCHIVED':
        computedVariant = 'archived';
        break;
    }
  }

  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    outline: 'border-zinc-700 text-zinc-300 bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide uppercase',
        variants[computedVariant as keyof typeof variants] || variants.default,
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
}

