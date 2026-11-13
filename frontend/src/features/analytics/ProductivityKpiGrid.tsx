import React from 'react';
import type { ProductivityOverview, WorkSession } from '../../types';
import { formatDurationHoursMinutes } from '../../lib/utils';
import {
  Clock,
  Calendar,
  Flame,
  CheckCircle2,
  FolderKanban,
  Zap,
  Timer,
} from 'lucide-react';

interface ProductivityKpiGridProps {
  overview: ProductivityOverview;
  activeSession?: WorkSession | null;
  elapsedSeconds?: number;
}

export const ProductivityKpiGrid: React.FC<ProductivityKpiGridProps> = ({
  overview,
  activeSession,
  elapsedSeconds = 0,
}) => {
  // If active session belongs to this period, adjust live seconds smoothly
  const liveActiveExtra =
    activeSession && activeSession.status === 'ACTIVE'
      ? Math.max(0, elapsedSeconds - overview.totalElapsedActiveSeconds)
      : 0;

  const totalDevSeconds = overview.totalWorkingSeconds + liveActiveExtra;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Development Time */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Development Time</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <span>{formatDurationHoursMinutes(totalDevSeconds)}</span>
            {activeSession && activeSession.status === 'ACTIVE' && (
              <span className="flex h-2 w-2 relative" title="Live session ticking">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Actual focused coding time (excluding pauses)
          </p>
        </div>
      </div>

      {/* 2. Daily Average Time */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Daily Average Time</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatDurationHoursMinutes(overview.averageDailyWorkingSeconds)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Across all calendar days in selected period
          </p>
        </div>
      </div>

      {/* 3. Active-Day Average Time */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Active-Day Average</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatDurationHoursMinutes(overview.averageActiveDayWorkingSeconds)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Average velocity on days with recorded work
          </p>
        </div>
      </div>

      {/* 4. Total Work Sessions */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Work Sessions</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Timer className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {overview.totalSessions} <span className="text-xs font-normal text-zinc-400">sessions</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Discrete development sessions completed
          </p>
        </div>
      </div>

      {/* 5. Active Development Days */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Active Coding Days</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {overview.activeDays} <span className="text-xs font-normal text-zinc-400">days</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Distinct calendar days with active coding
          </p>
        </div>
      </div>

      {/* 6. Tasks Completed */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Tasks Completed</span>
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {overview.tasksCompleted} <span className="text-xs font-normal text-zinc-400">tasks</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Tasks marked completed in this period
          </p>
        </div>
      </div>

      {/* 7. Active Projects Count */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex flex-col justify-between shadow-xs hover:border-zinc-700/80 transition-all sm:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Active Projects Count</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {overview.activeProjectCount} <span className="text-xs font-normal text-zinc-400">projects active</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Projects receiving recorded development time in this period
          </p>
        </div>
      </div>
    </div>
  );
};

