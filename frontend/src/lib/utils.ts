import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDurationHM(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}

export function formatDurationHoursMinutes(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return '0h 00m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${hours}h ${pad(minutes)}m`;
}

export function formatDurationWords(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return '0 mins';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}


export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function calculateWorkingSeconds(
  startedAt: string,
  endedAt?: string | null,
  pauseIntervals?: { pausedAt: string; resumedAt?: string | null }[],
  asOfNow = Date.now()
): number {
  const startTime = new Date(startedAt).getTime();
  if (isNaN(startTime)) return 0;

  let ceilingTime = endedAt ? new Date(endedAt).getTime() : asOfNow;
  let closedPausedMs = 0;

  if (pauseIntervals && pauseIntervals.length > 0) {
    for (const interval of pauseIntervals) {
      const pausedTime = new Date(interval.pausedAt).getTime();
      if (interval.resumedAt) {
        const resumedTime = new Date(interval.resumedAt).getTime();
        if (resumedTime > pausedTime) {
          closedPausedMs += resumedTime - pausedTime;
        }
      } else {
        if (pausedTime < ceilingTime) {
          ceilingTime = pausedTime;
        }
      }
    }
  }

  const workingMs = ceilingTime - startTime - closedPausedMs;
  return Math.max(0, Math.floor(workingMs / 1000));
}


