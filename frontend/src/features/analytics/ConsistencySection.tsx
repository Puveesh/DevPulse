import React, { useState } from 'react';
import type { ConsistencyMetrics, DailyActivity } from '../../types';
import { formatDurationHoursMinutes } from '../../lib/utils';
import { Flame, Award, Calendar, Clock, Sun, Sunset, Moon, Sparkles } from 'lucide-react';

interface ConsistencySectionProps {
  consistency: ConsistencyMetrics;
  dailyTimeline: DailyActivity[];
}

export const ConsistencySection: React.FC<ConsistencySectionProps> = ({
  consistency,
  dailyTimeline,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    day: string;
    durationSeconds: number;
    sessionsCount: number;
    x: number;
    y: number;
  } | null>(null);

  // Intensity color helper based on seconds
  const getCellIntensity = (seconds: number) => {
    if (seconds === 0) return 'bg-zinc-850 hover:border-zinc-600 border border-zinc-800/60';
    const hours = seconds / 3600;
    if (hours < 1) return 'bg-emerald-950 border border-emerald-800/60 hover:border-emerald-600';
    if (hours < 2) return 'bg-emerald-800 border border-emerald-600 hover:border-emerald-400';
    if (hours < 4) return 'bg-emerald-600 border border-emerald-400 hover:border-emerald-300';
    return 'bg-emerald-400 border border-emerald-300 hover:border-white shadow-xs';
  };

  // Time-of-day total for percentage calculations
  const totalTimeOfDay =
    consistency.morningSeconds +
    consistency.afternoonSeconds +
    consistency.eveningSeconds +
    consistency.nightSeconds;

  const getSlotPct = (sec: number) =>
    totalTimeOfDay > 0 ? Math.round((sec / totalTimeOfDay) * 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Development Consistency & Working Habits</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cadence heatmap, streak tracking, and diurnal productivity distribution
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400">Peak Window:</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-blue-400 border border-zinc-700">
            {consistency.mostProductiveTimeSlot}
          </span>
        </div>
      </div>

      {/* GitHub-style Contribution Heatmap */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Activity Calendar Matrix</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-zinc-850 border border-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-950 border border-emerald-800" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-800 border border-emerald-600" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 border border-emerald-400" />
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-300" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-x-auto relative">
          <div className="flex flex-wrap gap-1.5 min-w-[320px]">
            {dailyTimeline.map((item) => {
              const sessionsCount = item.projects?.length || (item.durationSeconds > 0 ? 1 : 0);
              return (
                <div
                  key={item.date}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredDay({
                      date: item.date,
                      day: item.day,
                      durationSeconds: item.durationSeconds,
                      sessionsCount,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-xs cursor-pointer transition-all ${getCellIntensity(
                    item.durationSeconds
                  )}`}
                />
              );
            })}
          </div>

          {/* Floating Tooltip */}
          {hoveredDay && (
            <div
              style={{
                position: 'fixed',
                left: hoveredDay.x,
                top: hoveredDay.y - 48,
                transform: 'translateX(-50%)',
                zIndex: 9999,
              }}
              className="pointer-events-none rounded-lg border border-zinc-700 bg-zinc-950/95 px-2.5 py-1.5 shadow-2xl backdrop-blur text-[11px] text-zinc-200"
            >
              <div className="font-semibold text-white">
                {hoveredDay.day}, {hoveredDay.date}
              </div>
              <div className="font-mono text-emerald-400 font-bold mt-0.5">
                {formatDurationHoursMinutes(hoveredDay.durationSeconds)} (
                {hoveredDay.durationSeconds > 0 ? `${hoveredDay.sessionsCount} session(s)` : 'No work'})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Habits & Diurnal Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak & Consistency KPIs */}
        <div className="space-y-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="text-xs font-semibold text-zinc-300 block">Consistency Dynamics</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                <Flame className="w-3.5 h-3.5" />
                <span>Current Streak</span>
              </div>
              <div className="mt-1 text-xl font-bold font-mono text-white">
                {consistency.currentStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">Consecutive coding days</p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-purple-400 font-medium text-[11px]">
                <Award className="w-3.5 h-3.5" />
                <span>Longest Streak</span>
              </div>
              <div className="mt-1 text-xl font-bold font-mono text-white">
                {consistency.longestStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">All-time personal record</p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-blue-400 font-medium text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Active Ratio</span>
              </div>
              <div className="mt-1 text-xl font-bold font-mono text-white">
                {consistency.activeDaysRatio}%
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {consistency.activeDays} of {consistency.totalDays} days active
              </p>
            </div>

            <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Peak Weekday</span>
              </div>
              <div className="mt-1 text-base font-bold font-mono text-white truncate">
                {consistency.mostActiveWeekday}
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">Most productive day of week</p>
            </div>
          </div>
        </div>

        {/* Diurnal Time-of-Day Distribution */}
        <div className="space-y-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
          <span className="text-xs font-semibold text-zinc-300 block">Time-of-Day Working Patterns</span>

          <div className="space-y-2.5 text-xs">
            {/* Morning */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Morning (06:00 – 12:00)
                </span>
                <span className="font-mono text-zinc-400">
                  {formatDurationHoursMinutes(consistency.morningSeconds)} ({getSlotPct(consistency.morningSeconds)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${getSlotPct(consistency.morningSeconds)}%` }}
                />
              </div>
            </div>

            {/* Afternoon */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Afternoon (12:00 – 18:00)
                </span>
                <span className="font-mono text-zinc-400">
                  {formatDurationHoursMinutes(consistency.afternoonSeconds)} ({getSlotPct(consistency.afternoonSeconds)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${getSlotPct(consistency.afternoonSeconds)}%` }}
                />
              </div>
            </div>

            {/* Evening */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Sunset className="w-3.5 h-3.5 text-purple-400" />
                  Evening (18:00 – 00:00)
                </span>
                <span className="font-mono text-zinc-400">
                  {formatDurationHoursMinutes(consistency.eveningSeconds)} ({getSlotPct(consistency.eveningSeconds)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${getSlotPct(consistency.eveningSeconds)}%` }}
                />
              </div>
            </div>

            {/* Night */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  Night (00:00 – 06:00)
                </span>
                <span className="font-mono text-zinc-400">
                  {formatDurationHoursMinutes(consistency.nightSeconds)} ({getSlotPct(consistency.nightSeconds)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${getSlotPct(consistency.nightSeconds)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
