import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AnalyticsDatePreset } from '../../types';
import {
  Calendar as CalendarIcon,
  Globe,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({
  preset,
  onChangePreset,
  startDate,
  endDate,
  onChangeCustomRange,
  timezone,
}) => {
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [activePickerTarget, setActivePickerTarget] = useState<'start' | 'end'>('start');
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date(startDate || Date.now());
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync draft dates whenever props change
  useEffect(() => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
  }, [startDate, endDate]);

  // Keep viewDate in sync with draftStart when opening
  const handleOpenPicker = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setActivePickerTarget('start');
    const d = new Date(startDate || Date.now());
    setViewDate(isNaN(d.getTime()) ? new Date() : d);
    setIsCustomPickerOpen(true);
  };

  const handleSelectPreset = (optValue: AnalyticsDatePreset) => {
    if (optValue === 'CUSTOM') {
      handleOpenPicker();
    } else {
      setIsCustomPickerOpen(false);
      onChangePreset(optValue);
    }
  };

  // Validation
  const validationError = useMemo(() => {
    if (!draftStart || !draftEnd) {
      return 'Both start and end dates are required.';
    }
    if (draftEnd < draftStart) {
      return 'End date cannot be earlier than start date.';
    }
    return null;
  }, [draftStart, draftEnd]);

  const isValidRange = !validationError && draftStart.length === 10 && draftEnd.length === 10;

  const handleApply = () => {
    if (!isValidRange) return;
    onChangeCustomRange(draftStart, draftEnd);
    onChangePreset('CUSTOM');
    setIsCustomPickerOpen(false);
  };

  const handleCancel = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setIsCustomPickerOpen(false);
  };

  const handleReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);
    const startStr = thirtyDaysAgo.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    setDraftStart(startStr);
    setDraftEnd(endStr);
    setViewDate(thirtyDaysAgo);
    setActivePickerTarget('start');
  };

  // Month navigation
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleChangeMonth = (mIdx: number) => {
    setViewDate(new Date(currentYear, mIdx, 1));
  };

  const handleChangeYear = (yr: number) => {
    setViewDate(new Date(yr, currentMonth, 1));
  };

  // Build calendar matrix (Monday - Sunday)
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday-based day of week (0 = Monday, ..., 6 = Sunday)
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(currentYear, currentMonth, d);
      const yearStr = curDate.getFullYear().toString();
      const monthStr = (curDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Trailing days from next month to complete row
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const yearStr = nextDate.getFullYear().toString();
      const monthStr = (nextDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handleDayClick = (dateStr: string) => {
    if (activePickerTarget === 'start') {
      setDraftStart(dateStr);
      // If new start is after current end, adjust end to match
      if (draftEnd && dateStr > draftEnd) {
        setDraftEnd(dateStr);
      }
      setActivePickerTarget('end');
    } else {
      if (draftStart && dateStr < draftStart) {
        // If clicked date is before start date, set as start date instead
        setDraftStart(dateStr);
      } else {
        setDraftEnd(dateStr);
      }
    }
  };

  // Year options list for dropdown (e.g. 2020 through current year + 2)
  const currentWallYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = currentWallYear - 6; y <= currentWallYear + 3; y++) {
      list.push(y);
    }
    return list;
  }, [currentWallYear]);

  return (
    <div className="flex flex-col gap-3">
      {/* Main Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 shadow-xs">
        {/* Preset pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_OPTIONS.map((opt) => {
            const isActive = preset === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectPreset(opt.value)}
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

        {/* Right side: Custom Range indicator button & Timezone */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          {preset === 'CUSTOM' ? (
            <button
              type="button"
              onClick={() => setIsCustomPickerOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors cursor-pointer"
              title="Click to change custom date range"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {startDate} → {endDate}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>Timezone: {timezone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Custom Date Range Calendar Picker */}
      {isCustomPickerOpen && (
        <div
          ref={pickerRef}
          className="rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-150 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>Select Custom Date Range</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Pick start and end boundaries to synchronize all Analytics modules
              </p>
            </div>

            {/* Target Selector Tabs */}
            <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setActivePickerTarget('start')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activePickerTarget === 'start'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Start Date: <span className="font-mono text-zinc-200">{draftStart || 'Select'}</span>
              </button>
              <span className="text-zinc-600">→</span>
              <button
                type="button"
                onClick={() => setActivePickerTarget('end')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activePickerTarget === 'end'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                End Date: <span className="font-mono text-zinc-200">{draftEnd || 'Select'}</span>
              </button>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Calendar Month / Year Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={currentMonth}
                onChange={(e) => handleChangeMonth(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => handleChangeYear(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick text input controls */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 text-[11px]">Direct Entry:</span>
              <input
                type="date"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="bg-zinc-900 border border-zinc-750 text-zinc-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-zinc-600">to</span>
              <input
                type="date"
                value={draftEnd}
                min={draftStart}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="bg-zinc-900 border border-zinc-750 text-zinc-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-850">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-zinc-500 pb-2 border-b border-zinc-800">
              {WEEKDAY_HEADERS.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1 pt-2">
              {calendarDays.map(({ dateStr, dayNum, isCurrentMonth }) => {
                const isSelectedStart = dateStr === draftStart;
                const isSelectedEnd = dateStr === draftEnd;
                const isInRange = draftStart && draftEnd && dateStr > draftStart && dateStr < draftEnd;

                let cellBg = isCurrentMonth ? 'text-zinc-200 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-850/50';

                if (isSelectedStart || isSelectedEnd) {
                  cellBg = 'bg-blue-600 text-white font-bold shadow-xs';
                } else if (isInRange) {
                  cellBg = 'bg-blue-900/30 text-blue-200 border border-blue-800/40';
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    className={`h-8 rounded-lg flex items-center justify-center text-xs font-mono transition-all cursor-pointer ${cellBg}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset (Last 30 Days)</span>
            </button>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleApply}
                disabled={!isValidRange}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

