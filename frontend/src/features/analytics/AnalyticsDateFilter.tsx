import React from 'react';
import type { AnalyticsDatePreset } from '../../types';
import { Calendar, Globe } from 'lucide-react';

interface AnalyticsDateFilterProps {
  preset: AnalyticsDatePreset;
  onChangePreset: (preset: AnalyticsDatePreset) => void;
  startDate: string;
  endDate: string;
  onChangeCustomRange: (start: string, end: string) => void;
  timezone: string;
}

const PRESET_OPTIONS: { label: string; value: AnalyticsDatePreset }[] = [
  { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
  { label: 'Last 90 Days', value: 'LAST_90_DAYS' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'This Year', value: 'THIS_YEAR' },
  { label: 'All Time', value: 'ALL_TIME' },
  { label: 'Custom Range', value: 'CUSTOM' },
];

export const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({
  preset,
  onChangePreset,
  startDate,
  endDate,
  onChangeCustomRange,
  timezone,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 shadow-xs">
      {/* Preset pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_OPTIONS.map((opt) => {
          const isActive = preset === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChangePreset(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-750'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Right controls: Custom range inputs or timezone indicator */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        {preset === 'CUSTOM' ? (
          <div className="flex items-center gap-2 bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onChangeCustomRange(e.target.value, endDate)}
              className="bg-transparent border-none text-zinc-200 text-xs focus:outline-none focus:ring-0 font-mono"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onChangeCustomRange(startDate, e.target.value)}
              className="bg-transparent border-none text-zinc-200 text-xs focus:outline-none focus:ring-0 font-mono"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>Timezone: {timezone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

