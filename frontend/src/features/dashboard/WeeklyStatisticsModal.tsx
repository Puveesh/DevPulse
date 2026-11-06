import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useWeeklyAnalytics } from '../../hooks/useAnalytics';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { formatDurationHoursMinutes, formatDate } from '../../lib/utils';
import type { DailyActivity, ProjectDuration } from '../../types';

interface WeeklyStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROJECT_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#e11d48', // Rose
  '#0284c7', // Sky
];

export function getLocalMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Sunday is 0, Monday is 1...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dDate = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dDate}`;
}

export function shiftWeekMonday(mondayStr: string, weeks: number): string {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dDate = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${dDate}`;
}

export function formatWeekHeader(weekStartStr?: string, weekEndStr?: string): string {
  if (!weekStartStr || !weekEndStr) return '';
  return `${formatDate(weekStartStr)} – ${formatDate(weekEndStr)}`;
}

interface ActiveProjectInfo {
  key: string;
  name: string;
  color: string;
  totalSeconds: number;
}

export const WeeklyStatisticsModal: React.FC<WeeklyStatisticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentWeekMonday = useMemo(() => getLocalMonday(), []);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(currentWeekMonday);

  const { activeSession, elapsedSeconds } = useWorkSessionContext();
  const { data: weeklyData, isLoading } = useWeeklyAnalytics(undefined, selectedWeekStart);

  const isCurrentWeek = selectedWeekStart === currentWeekMonday;

  // Live active session extra seconds (only relevant when viewing the current week)
  const liveWeeklyExtra =
    isCurrentWeek && activeSession && activeSession.status === 'ACTIVE'
      ? Math.max(0, elapsedSeconds - (weeklyData?.activeSessionWeeklyWorkingSeconds || 0))
      : 0;

  const liveTotalWeeklySeconds = (weeklyData?.totalDurationSeconds || 0) + liveWeeklyExtra;

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Compute active projects in this week with persistent color assignment
  const { activeProjectsInWeek, projectMap } = useMemo(() => {
    const durationByProject = new Map<string, { name: string; seconds: number }>();

    (weeklyData?.dailyActivity || []).forEach((day: DailyActivity) => {
      (day.projects || []).forEach((p: ProjectDuration) => {
        const key = p.projectId || p.projectName;
        const current = durationByProject.get(key) || { name: p.projectName, seconds: 0 };
        current.seconds += p.durationSeconds;
        durationByProject.set(key, current);
      });
    });

    // If an active session is currently running for a project, allocate live extra seconds
    if (isCurrentWeek && activeSession && activeSession.status === 'ACTIVE' && liveWeeklyExtra > 0) {
      const activeKey = activeSession.projectId || activeSession.projectName || 'General Development';
      const activeName = activeSession.projectName || 'General Development';
      const current = durationByProject.get(activeKey) || { name: activeName, seconds: 0 };
      current.seconds += liveWeeklyExtra;
      durationByProject.set(activeKey, current);
    }

    // Sort projects descending by total duration to assign prominent colors first
    const sortedEntries = Array.from(durationByProject.entries()).sort(
      (a, b) => b[1].seconds - a[1].seconds
    );

    const projList: ActiveProjectInfo[] = [];
    const map = new Map<string, ActiveProjectInfo>();

    sortedEntries.forEach(([key, val], idx) => {
      if (val.seconds > 0) {
        const color = PROJECT_PALETTE[idx % PROJECT_PALETTE.length];
        const info: ActiveProjectInfo = {
          key,
          name: val.name,
          color,
          totalSeconds: val.seconds,
        };
        projList.push(info);
        map.set(key, info);
      }
    });

    return { activeProjectsInWeek: projList, projectMap: map };
  }, [weeklyData?.dailyActivity, isCurrentWeek, activeSession, liveWeeklyExtra]);

  // Transform dailyActivity for Recharts stacked bar chart
  const chartData = useMemo(() => {
    if (!weeklyData?.dailyActivity) return [];

    return weeklyData.dailyActivity.map((dayItem: DailyActivity) => {
      const row: Record<string, any> = {
        date: dayItem.date,
        day: dayItem.day,
        totalDurationSeconds: dayItem.durationSeconds,
      };

      // Populate each project's duration for this day
      (dayItem.projects || []).forEach((p: ProjectDuration) => {
        const key = p.projectId || p.projectName;
        row[key] = p.durationSeconds;
      });

      // Inject live seconds into today's active project segment if applicable
      if (
        isCurrentWeek &&
        dayItem.date === todayStr &&
        activeSession &&
        activeSession.status === 'ACTIVE' &&
        liveWeeklyExtra > 0
      ) {
        const activeKey = activeSession.projectId || activeSession.projectName || 'General Development';
        row[activeKey] = (row[activeKey] || 0) + liveWeeklyExtra;
        row.totalDurationSeconds = (row.totalDurationSeconds || 0) + liveWeeklyExtra;
      }

      return row;
    });
  }, [weeklyData?.dailyActivity, isCurrentWeek, todayStr, activeSession, liveWeeklyExtra]);

  // Week navigation handlers
  const handlePrevWeek = () => {
    setSelectedWeekStart((prev) => shiftWeekMonday(prev, -1));
  };

  const handleNextWeek = () => {
    if (isCurrentWeek) return;
    setSelectedWeekStart((prev) => {
      const next = shiftWeekMonday(prev, 1);
      return next > currentWeekMonday ? currentWeekMonday : next;
    });
  };

  const handleJumpToCurrentWeek = () => {
    setSelectedWeekStart(currentWeekMonday);
  };

  // Custom Stacked Bar Tooltip
  const CustomStackedTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const dayRow = payload[0]?.payload || {};
      const dayTotal = dayRow.totalDurationSeconds || 0;
      const activeSegments = payload.filter((p: any) => p.value > 0);

      return (
        <div className="rounded-lg border border-zinc-700 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur text-xs z-50 min-w-[220px]">
          <div className="pb-2 mb-2.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="font-semibold text-zinc-100">{label || dayRow.day}</span>
            <span className="font-mono text-zinc-400 text-[11px]">{dayRow.date}</span>
          </div>

          {activeSegments.length === 0 ? (
            <p className="text-zinc-500 italic py-1">No development activity</p>
          ) : (
            <div className="space-y-2.5">
              {activeSegments.map((seg: any) => {
                const duration = Number(seg.value || 0);
                const percent =
                  dayTotal > 0 ? ((duration / dayTotal) * 100).toFixed(1) : '0.0';
                const proj = projectMap.get(seg.dataKey);
                const projName = proj?.name || seg.name;

                return (
                  <div key={seg.dataKey} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 font-medium text-zinc-200 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="truncate max-w-[140px]">{projName}</span>
                      </span>
                      <span className="font-mono text-zinc-200 font-semibold shrink-0">
                        {formatDurationHoursMinutes(duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pl-4">
                      <span>Daily contribution</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 mt-1 border-t border-zinc-800 flex items-center justify-between font-semibold text-zinc-200">
                <span>Day Total</span>
                <span className="font-mono text-white text-xs">
                  {formatDurationHoursMinutes(dayTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Weekly Development Activity"
      description="Detailed project-wise distribution and weekly productivity breakdown."
      className="max-w-3xl sm:max-w-4xl"
    >
      <div className="space-y-6">
        {/* Navigation & Period Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              className="text-xs h-8 px-2.5"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous Week
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              disabled={isCurrentWeek}
              className="text-xs h-8 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next Week
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{formatWeekHeader(weeklyData?.weekStart, weeklyData?.weekEnd)}</span>
            </div>

            {!isCurrentWeek && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleJumpToCurrentWeek}
                className="text-xs h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
              >
                Current Week
              </Button>
            )}
          </div>
        </div>

        {/* 4-Metric Weekly Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Total Logged
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                {formatDurationHoursMinutes(liveTotalWeeklySeconds)}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Active Days
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                {weeklyData?.activeDays || (liveTotalWeeklySeconds > 0 ? 1 : 0)} / 7
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Most Active Day
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-20 mt-1" />
            ) : (
              <div className="text-lg font-bold text-zinc-100 mt-1 truncate">
                {weeklyData?.mostActiveDay || (liveTotalWeeklySeconds > 0 ? 'Today' : '--')}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              Projects
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                {activeProjectsInWeek.length}{' '}
                <span className="text-xs text-zinc-400 font-sans font-normal">
                  {activeProjectsInWeek.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-coloured Project Stacked Bar Chart */}
        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/70">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Weekly Project Activity Breakdown
              </h3>
              <p className="text-[11px] text-zinc-400">
                Multi-coloured segments represent distinct project contributions.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-72 w-full flex items-center justify-center">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : liveTotalWeeklySeconds === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <Clock className="w-8 h-8 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">
                No development activity recorded for this week.
              </p>
              <p className="text-xs text-zinc-500 max-w-sm">
                Start a development session using the timer to automatically log activity.
              </p>
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(sec) => `${(sec / 3600).toFixed(1)}h`}
                  />
                  <Tooltip
                    content={<CustomStackedTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 4 }}
                  />
                  {activeProjectsInWeek.map((proj, idx) => (
                    <Bar
                      key={proj.key}
                      dataKey={proj.key}
                      name={proj.name}
                      stackId="weekly-projects"
                      fill={proj.color}
                      radius={
                        idx === activeProjectsInWeek.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                      }
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Project Legend */}
        {activeProjectsInWeek.length > 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Project Legend & Distribution</span>
              <span>{activeProjectsInWeek.length} active this week</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {activeProjectsInWeek.map((proj) => {
                const percent =
                  liveTotalWeeklySeconds > 0
                    ? ((proj.totalSeconds / liveTotalWeeklySeconds) * 100).toFixed(1)
                    : '0.0';

                return (
                  <div
                    key={proj.key}
                    className="flex items-center justify-between p-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className="w-3 h-3 rounded-xs shrink-0"
                        style={{ backgroundColor: proj.color }}
                      />
                      <span className="font-medium text-zinc-200 truncate">
                        {proj.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-zinc-300 block">
                        {formatDurationHoursMinutes(proj.totalSeconds)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
