import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionText, onAction, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40',
        className
      )}
    >
      {icon && <div className="p-3 mb-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">{icon}</div>}
      <h4 className="text-base font-semibold text-zinc-200 tracking-tight">{title}</h4>
      <p className="text-xs text-zinc-400 max-w-sm mt-1.5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}

