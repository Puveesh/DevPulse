import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { DailyActivity } from '../../types';
import { formatDurationHoursMinutes } from '../../lib/utils';
import { TrendingUp, Award, Clock } from 'lucide-react';

interface DevelopmentTimeChartProps {
  dailyTimeline: DailyActivity[];
  totalWorkingSeconds: number;
  averageActiveDaySeconds: number;
  mostActiveDayName?: string;
  mostActiveDaySeconds?: number;
  leastActiveDaySeconds?: number;
}

interface ChartItem {
  date: string;
  day: string;
  displayDate: string;
  durationSeconds: number;
  hours: number;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartItem }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 px-3 py-2 shadow-2xl backdrop-blur text-xs z-50">
        <p className="font-semibold text-zinc-200">
          {data.day}, {data.date}
        </p>
        <p className="font-mono font-bold text-blue-400 mt-1">
          {formatDurationHoursMinutes(data.durationSeconds)} ({data.hours} hrs)
        </p>
      </div>
    );
  }
  return null;
};

export const DevelopmentTimeChart: React.FC<DevelopmentTimeChartProps> = ({
  dailyTimeline,
  totalWorkingSeconds,
  averageActiveDaySeconds,
  mostActiveDayName = 'None',
  mostActiveDaySeconds = 0,
  leastActiveDaySeconds = 0,
}) => {
  const chartData: ChartItem[] = (dailyTimeline || []).map((item) => {
    // Format YYYY-MM-DD to "MMM DD"
    const parts = item.date.split('-');
    const displayDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
    return {
      date: item.date,
      day: item.day,
      displayDate,
      durationSeconds: item.durationSeconds,
      hours: Number((item.durationSeconds / 3600).toFixed(2)),
    };
  });

  const maxSeconds = Math.max(...chartData.map((d) => d.durationSeconds), 0);

  // Auto-generate explanatory summary statement from actual data
  const summaryExplanation =
    totalWorkingSeconds > 0
      ? `You spent ${formatDurationHoursMinutes(totalWorkingSeconds)} developing during this period, with ${mostActiveDayName} being your most active day (${formatDurationHoursMinutes(mostActiveDaySeconds)}).`
      : 'No development sessions were recorded during this period.';

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Development Time Analysis</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">{summaryExplanation}</p>
        </div>

        {/* Highlight stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Peak: {formatDurationHoursMinutes(mostActiveDaySeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Active Avg: {formatDurationHoursMinutes(averageActiveDaySeconds)}</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            barCategoryGap={chartData.length > 31 ? '10%' : '20%'}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="displayDate"
              axisLine={{ stroke: '#27272a' }}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              interval={chartData.length > 30 ? Math.floor(chartData.length / 10) : 0}
            />
            <YAxis
              axisLine={{ stroke: '#27272a' }}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${(val / 3600).toFixed(0)}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 4 }} />
            <Bar dataKey="durationSeconds" radius={[4, 4, 0, 0]} minPointSize={maxSeconds > 0 ? 3 : 1}>
              {chartData.map((entry, index) => {
                let fill = '#27272a'; // idle baseline
                if (entry.durationSeconds > 0) {
                  fill = entry.durationSeconds === maxSeconds ? '#3b82f6' : '#2563eb';
                }
                return <Cell key={`cell-${index}`} fill={fill} className="transition-colors duration-150" />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Micro-insights footer */}
      <div className="pt-3 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-zinc-500 block text-[11px]">Total Tracked</span>
          <span className="font-mono text-zinc-200 font-semibold">{formatDurationHoursMinutes(totalWorkingSeconds)}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Most Active Day</span>
          <span className="font-mono text-zinc-200 font-semibold">{mostActiveDayName}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Least Active (Non-zero)</span>
          <span className="font-mono text-zinc-200 font-semibold">
            {leastActiveDaySeconds > 0 ? formatDurationHoursMinutes(leastActiveDaySeconds) : '--'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Daily Active Pace</span>
          <span className="font-mono text-zinc-200 font-semibold">{formatDurationHoursMinutes(averageActiveDaySeconds)}</span>
        </div>
      </div>
    </div>
  );
};

