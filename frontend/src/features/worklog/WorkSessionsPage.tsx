import { useState, useEffect, useMemo } from 'react';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { useSearchWorkSessions } from '../../hooks/useWorkSessions';
import { useProjects } from '../../hooks/useProjects';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Clock,
  Play,
  Pause,
  Square,
  FileText,
  Calendar,
  FolderKanban,
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';
import { formatDate, formatTime, formatDuration, cn } from '../../lib/utils';
import { SessionDetailModal } from './SessionDetailModal';
import type { WorkSession, WorkSessionSearchParams } from '../../types';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function WorkSessionsPage() {
  const {
    activeSession,
    elapsedSeconds,
    openStartModal,
    openEndModal,
    pauseSession,
    resumeSession,
    isPausing,
    isResuming,
  } = useWorkSessionContext();

  const { data: projects = [] } = useProjects();

  // Filter state
  const [titleInput, setTitleInput] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateMode, setDateMode] = useState<'month-year' | 'specific-date'>('month-year');
  const [specificDate, setSpecificDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Selected session for detail modal
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);

  // Debounce title input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(titleInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [titleInput]);

  // Construct search params adhering to precedence & default year rules
  const searchParams: WorkSessionSearchParams = useMemo(() => {
    const p: WorkSessionSearchParams = {};
    if (debouncedTitle.trim()) {
      p.title = debouncedTitle.trim();
    }
    if (selectedProjectId) {
      p.projectId = selectedProjectId;
    }
    if (dateMode === 'specific-date') {
      if (specificDate) {
        p.date = specificDate;
      }
    } else {
      if (selectedMonth) {
        p.month = Number(selectedMonth);
        if (selectedYear) {
          p.year = Number(selectedYear);
        }
      } else if (selectedYear) {
        p.year = Number(selectedYear);
      }
    }
    return p;
  }, [debouncedTitle, selectedProjectId, dateMode, specificDate, selectedMonth, selectedYear]);

  const hasAnyFilter = Boolean(
    debouncedTitle.trim() ||
    selectedProjectId ||
    (dateMode === 'specific-date' && specificDate) ||
    (dateMode === 'month-year' && (selectedMonth || selectedYear))
  );

  const { data: sessionsData, isLoading } = useSearchWorkSessions(searchParams, 0, 100);

  const allSessions = sessionsData?.content || [];
  const completedSessions = allSessions.filter((s) => s.status === 'COMPLETED');

  const handleClearAllFilters = () => {
    setTitleInput('');
    setDebouncedTitle('');
    setSelectedProjectId('');
    setSpecificDate('');
    setSelectedMonth('');
    setSelectedYear('');
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Work Sessions</h1>
          <p className="text-xs text-zinc-400 mt-1">Live tracking, search, and development session history.</p>
        </div>

        <div>
          {!activeSession ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={() => openStartModal()}
            >
              Start Session
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              className="bg-red-600 hover:bg-red-500 border-none text-white"
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={openEndModal}
            >
              End Session ({formatDuration(elapsedSeconds)})
            </Button>
          )}
        </div>
      </div>

      {/* Active Session Banner if in progress or paused */}
      {activeSession && (
        <Card className="border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {activeSession.status === 'ACTIVE' ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Active Session in Progress
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Session Paused
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-lg font-bold text-white">{activeSession.title}</h3>
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                  {activeSession.projectName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Started {formatTime(activeSession.startedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Working Time</span>
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {formatDuration(elapsedSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeSession.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Pause className="w-3.5 h-3.5 text-amber-400" />}
                    isLoading={isPausing}
                    disabled={isPausing}
                    onClick={() => pauseSession(activeSession.id)}
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
                    isLoading={isResuming}
                    disabled={isResuming}
                    onClick={() => resumeSession(activeSession.id)}
                  >
                    Resume
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-500 border-none text-white"
                  leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
                  onClick={openEndModal}
                >
                  End & Save
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Advanced Search & Filtering Section */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-xs">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-zinc-100">Search & Filter Work Sessions</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                OR Logic Active: Matches Any Filter
              </span>

              {hasAnyFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearAllFilters}
                  className="text-xs text-zinc-400 hover:text-zinc-200 h-7 px-2 cursor-pointer"
                  leftIcon={<RotateCcw className="w-3 h-3" />}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Filter Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* 1. Title Search (col-span-5) */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400 block">Work Session Title</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search work sessions by title..."
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {titleInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput('');
                      setDebouncedTitle('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    title="Clear title search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Project Name Filter (col-span-3) */}
            <div className="md:col-span-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400 block">Project Name</label>
                {selectedProjectId && (
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId('')}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Date Filter (col-span-4) */}
            <div className="md:col-span-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400 block">Date Filter</label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setDateMode('month-year');
                      setSpecificDate('');
                    }}
                    className={cn(
                      'px-1.5 py-0.5 rounded cursor-pointer transition-colors',
                      dateMode === 'month-year'
                        ? 'bg-zinc-800 text-blue-400 font-medium'
                        : 'text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    Month / Year
                  </button>
                  <span className="text-zinc-700">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDateMode('specific-date');
                      setSelectedMonth('');
                      setSelectedYear('');
                    }}
                    className={cn(
                      'px-1.5 py-0.5 rounded cursor-pointer transition-colors',
                      dateMode === 'specific-date'
                        ? 'bg-zinc-800 text-blue-400 font-medium'
                        : 'text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    Specific Date
                  </button>
                </div>
              </div>

              {dateMode === 'specific-date' ? (
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  />
                  {specificDate && (
                    <button
                      type="button"
                      onClick={() => setSpecificDate('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      title="Clear specific date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Months</option>
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Years</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-zinc-800/50">
              <span className="text-[11px] text-zinc-500 mr-1">Active Criteria (OR):</span>
              {debouncedTitle.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 text-[11px] border border-zinc-700/80">
                  Title: <span className="text-blue-400 font-medium">"{debouncedTitle.trim()}"</span>
                  <button
                    onClick={() => {
                      setTitleInput('');
                      setDebouncedTitle('');
                    }}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedProjectId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 text-[11px] border border-zinc-700/80">
                  Project:{' '}
                  <span className="text-emerald-400 font-medium">
                    {projects.find((p) => p.id === selectedProjectId)?.name || 'Selected'}
                  </span>
                  <button onClick={() => setSelectedProjectId('')} className="hover:text-red-400 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateMode === 'specific-date' && specificDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 text-[11px] border border-zinc-700/80">
                  Date: <span className="text-amber-400 font-mono font-medium">{specificDate}</span>
                  <button onClick={() => setSpecificDate('')} className="hover:text-red-400 cursor-pointer ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateMode === 'month-year' && (selectedMonth || selectedYear) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 text-[11px] border border-zinc-700/80">
                  Date:{' '}
                  <span className="text-amber-400 font-medium">
                    {selectedMonth
                      ? MONTH_OPTIONS.find((m) => m.value === Number(selectedMonth))?.label
                      : 'All Months'}{' '}
                    {selectedYear ? selectedYear : selectedMonth ? '(All Years)' : ''}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedMonth('');
                      setSelectedYear('');
                    }}
                    className="hover:text-red-400 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Sessions History List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>Session History</CardTitle>
              {hasAnyFilter ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-400 font-medium">
                    Showing {completedSessions.length} matching work session{completedSessions.length === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    OR Filter
                  </span>
                </div>
              ) : (
                <CardDescription>
                  All development sessions recorded in your workspace ({completedSessions.length})
                </CardDescription>
              )}
            </div>
            {hasAnyFilter && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAllFilters}
                className="text-xs text-zinc-300 hover:text-white"
                leftIcon={<RotateCcw className="w-3 h-3" />}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              Loading work sessions...
            </div>
          ) : completedSessions.length > 0 ? (
            <div className="divide-y divide-zinc-800/80">
              {completedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 p-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100 truncate">{session.title}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                        {session.projectName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {formatDate(session.startedAt)}
                      </span>
                      <span>
                        {formatTime(session.startedAt)} &rarr; {session.endedAt ? formatTime(session.endedAt) : ''}
                      </span>
                    </div>

                    {session.initialNotes && (
                      <p className="text-xs text-zinc-400 flex items-start gap-1.5 italic">
                        <span className="text-zinc-500 not-italic">Initial:</span>
                        <span>{session.initialNotes}</span>
                      </p>
                    )}

                    {session.sessionNotes && (
                      <p className="text-xs text-zinc-300 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                        <span className="line-clamp-2">{session.sessionNotes}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-zinc-200 block">
                      {formatDuration(session.totalDurationSeconds || 0)}
                    </span>
                    <span className="text-[10px] text-blue-400 hover:underline">View & Edit Notes</span>
                  </div>
                </div>
              ))}
            </div>
          ) : hasAnyFilter ? (
            <div className="py-12 px-4 text-center">
              <div className="inline-flex p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-3">
                <Search className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200">No work sessions found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                No work sessions match the selected search criteria. Try adjusting or clearing your filters.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={handleClearAllFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-8 h-8 text-blue-400" />}
              title="No Work Sessions Yet"
              description="Start a development session to track your time and progress automatically."
              actionText="Start First Session"
              onAction={() => openStartModal()}
            />
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <SessionDetailModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </div>
  );
}
