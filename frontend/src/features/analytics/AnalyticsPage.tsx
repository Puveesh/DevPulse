import { useState } from 'react';
import { useAnalyticsReport, getUserTimezone } from '../../hooks/useAnalytics';
import { useWorkSessionContext } from '../../contexts/WorkSessionContext';
import { AnalyticsDateFilter } from './AnalyticsDateFilter';
import { ProductivityKpiGrid } from './ProductivityKpiGrid';
import { DevelopmentTimeChart } from './DevelopmentTimeChart';
import { ProjectDistributionSection } from './ProjectDistributionSection';
import { TaskProgressSection } from './TaskProgressSection';
import { ConsistencySection } from './ConsistencySection';
import { DevelopmentInsightsSection } from './DevelopmentInsightsSection';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import type { AnalyticsDatePreset } from '../../types';

export function AnalyticsPage() {
  const [preset, setPreset] = useState<AnalyticsDatePreset>('LAST_30_DAYS');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const timezone = getUserTimezone();

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnalyticsReport(
    preset,
    preset === 'CUSTOM' ? customStart : undefined,
    preset === 'CUSTOM' ? customEnd : undefined,
    timezone
  );

  const { activeSession, elapsedSeconds } = useWorkSessionContext();

  const handleCustomRangeChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Developer Analytics</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Productivity velocity, project distribution, task completion, and coding habits derived from your actual workspace records.
        </p>
      </div>

      {/* Date Range Selector */}
      <AnalyticsDateFilter
        preset={preset}
        onChangePreset={setPreset}
        startDate={customStart}
        endDate={customEnd}
        onChangeCustomRange={handleCustomRangeChange}
        timezone={timezone}
      />

      {/* Error State */}
      {isError && (
        <Alert variant="error" title="Failed to load analytics">
          {error instanceof Error ? error.message : 'An error occurred while compiling your analytics.'}
          <div className="mt-2">
            <button
              onClick={() => refetch()}
              className="text-xs underline text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Try again
            </button>
          </div>
        </Alert>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : report ? (
        <div className="space-y-8">
          {/* 1. Developer Productivity Overview KPI Cards */}
          <section aria-label="Productivity Overview">
            <ProductivityKpiGrid
              overview={report.overview}
              activeSession={activeSession}
              elapsedSeconds={elapsedSeconds}
            />
          </section>

          {/* 2. Development Time Analysis Chart */}
          <section aria-label="Development Time Analysis">
            <DevelopmentTimeChart
              dailyTimeline={report.dailyTimeline}
              totalWorkingSeconds={report.overview.totalWorkingSeconds}
              averageActiveDaySeconds={report.overview.averageActiveDayWorkingSeconds}
              mostActiveDayName={report.consistency.mostActiveWeekday}
              mostActiveDaySeconds={report.consistency.mostActiveDaySeconds}
              leastActiveDaySeconds={report.consistency.leastActiveDaySeconds}
            />
          </section>

          {/* 3. Project Distribution & Progress Breakdown */}
          <section aria-label="Project Distribution">
            <ProjectDistributionSection
              projects={report.projects}
              totalWorkingSeconds={report.overview.totalWorkingSeconds}
            />
          </section>

          {/* 4. Task Progress & Completion Analysis */}
          <section aria-label="Task Progress Analysis">
            <TaskProgressSection
              tasks={report.tasks}
              projects={report.projects}
            />
          </section>

          {/* 5. Development Consistency & Working Habits */}
          <section aria-label="Development Consistency">
            <ConsistencySection
              consistency={report.consistency}
              dailyTimeline={report.dailyTimeline}
            />
          </section>

          {/* 6. Development Insights */}
          <section aria-label="Developer Insights">
            <DevelopmentInsightsSection insights={report.insights} />
          </section>

          {/* 7. Recent Development Activity Timeline */}
          <section aria-label="Recent Activity">
            <RecentActivityTimeline activities={report.recentActivities} />
          </section>
        </div>
      ) : null}
    </div>
  );
}
