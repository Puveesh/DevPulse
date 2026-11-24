import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  isOpen: boolean;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  durationMs?: number;
  onClose: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  type = 'success',
  title,
  message,
  durationMs = 5000,
  onClose,
  className,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsExiting(false);
      return;
    }

    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      const closeTimer = setTimeout(() => {
        onClose();
        setIsExiting(false);
      }, 200);
      return () => clearTimeout(closeTimer);
    }, durationMs);

    return () => {
      clearTimeout(dismissTimer);
    };
  }, [isOpen, message, type, durationMs, onClose]);

  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
  };

  const borderMap = {
    success: 'border-emerald-500/40 bg-zinc-900/95',
    error: 'border-red-500/40 bg-zinc-900/95',
    info: 'border-blue-500/40 bg-zinc-900/95',
  };

  const toastNode = (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 rounded-xl border shadow-2xl backdrop-blur-md text-xs text-zinc-200 transition-all duration-200 pointer-events-auto',
        borderMap[type],
        isExiting
          ? 'opacity-0 translate-y-2'
          : 'animate-in fade-in slide-in-from-bottom-3 duration-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {iconMap[type]}
        <div className="flex-1 min-w-0 pr-1">
          {title && <p className="font-semibold text-zinc-100 text-xs mb-0.5">{title}</p>}
          <p className="text-zinc-300 text-xs leading-relaxed">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 150);
          }}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );

  return createPortal(toastNode, document.body);
};
