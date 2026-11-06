import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DailyActivity } from '../../types';
import { formatDurationHoursMinutes } from '../../lib/utils';

interface WeeklyActivityChartProps {
  dailyActivity: DailyActivity[];
  todayDate: string;
}

interface ChartItem {
  day: string;
  date: string;
  durationSeconds: number;
  hours: number;
  isToday: boolean;
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
      <div className="rounded-md border border-zinc-700 bg-zinc-950/95 px-2.5 py-1.5 shadow-xl backdrop-blur text-xs z-50">
        <p className="font-medium text-zinc-300">
          {data.day} <span className="text-zinc-500 font-mono text-[10px]">({data.date})</span>
        </p>
        <p className="font-mono font-semibold text-emerald-400 mt-0.5">
          {formatDurationHoursMinutes(data.durationSeconds)}
        </p>
      </div>
    );
  }
  return null;
};

export const WeeklyActivityChart: React.FC<WeeklyActivityChartProps> = ({
  dailyActivity,
  todayDate,
}) => {
  const chartData: ChartItem[] = (dailyActivity || []).map((item) => ({
    day: item.day,
    date: item.date,
    durationSeconds: item.durationSeconds,
    hours: Number((item.durationSeconds / 3600).toFixed(2)),
    isToday: item.date === todayDate,
  }));

  // Find max hours to scale or provide a subtle baseline
  const maxSeconds = Math.max(...chartData.map((d) => d.durationSeconds), 0);

  return (
    <div className="w-full h-full min-h-[64px]" style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={70}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 2, left: 2, bottom: 0 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
          />
          <Bar dataKey="durationSeconds" radius={[3, 3, 0, 0]} minPointSize={maxSeconds > 0 ? 2 : 1}>
            {chartData.map((entry, index) => {
              let fill = '#27272a'; // zinc-800 default inactive baseline
              if (entry.durationSeconds > 0) {
                fill = entry.isToday ? '#10b981' : '#059669'; // emerald-500 for today, emerald-600 for past active
              } else if (entry.isToday) {
                fill = '#3f3f46'; // zinc-700 subtle highlight for current day even with 0s
              }
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={fill}
                  className="transition-colors duration-200"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

