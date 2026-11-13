import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ProjectAnalytics } from '../../types';
import { formatDurationHoursMinutes } from '../../lib/utils';
import { FolderKanban, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface ProjectDistributionSectionProps {
  projects: ProjectAnalytics[];
  totalWorkingSeconds: number;
}

const PROJECT_PALETTE = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // purple-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
];

export const ProjectDistributionSection: React.FC<ProjectDistributionSectionProps> = ({
  projects,
  totalWorkingSeconds,
}) => {
  const navigate = useNavigate();

  // Filter projects with >0 tracked time for the donut chart
  const activeTimeProjects = projects.filter((p) => p.totalWorkingSeconds > 0);

  const pieData = activeTimeProjects.map((p, idx) => ({
    name: p.projectName,
    value: p.totalWorkingSeconds,
    hours: Number((p.totalWorkingSeconds / 3600).toFixed(1)),
    percentage: p.percentageOfTotalTime,
    color: PROJECT_PALETTE[idx % PROJECT_PALETTE.length],
  }));

  // Horizontal bar comparison data
  const barData = activeTimeProjects.slice(0, 8).map((p, idx) => ({
    name: p.projectName.length > 16 ? p.projectName.substring(0, 14) + '...' : p.projectName,
    fullName: p.projectName,
    hours: Number((p.totalWorkingSeconds / 3600).toFixed(1)),
    color: PROJECT_PALETTE[idx % PROJECT_PALETTE.length],
  }));

  return (
    <div className="space-y-6">
      {/* Visual Charts: Donut + Horizontal Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                <span>Time Distribution by Project</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Share of total development hours</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {activeTimeProjects.length} active projects
            </span>
          </div>

          {pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-zinc-500">
              No development time tracked for projects in this period.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => [
                        formatDurationHoursMinutes(Number(val)),
                        'Time',
                      ]}
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list */}
              <div className="w-full sm:w-1/2 space-y-2 max-h-52 overflow-y-auto pr-1">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-zinc-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-zinc-400 shrink-0">
                      {item.percentage}% ({item.hours}h)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Bar Chart: Working Hours Comparison */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Project Work Hours Comparison</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Top projects by total hours</p>
            </div>
            <span className="text-xs font-mono text-zinc-400">Hours</span>
          </div>

          {barData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-zinc-500">
              No project comparisons available.
            </div>
          ) : (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={barData}
                  margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={false}
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [`${val} hours`, 'Tracked Time']}
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Project Progress & Task Breakdown Cards / Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Project Progress Overview</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Time allocation, work sessions, and task completion metrics per project
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">No projects registered yet.</div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {projects.map((p, idx) => {
              const color = PROJECT_PALETTE[idx % PROJECT_PALETTE.length];
              return (
                <div
                  key={p.projectId}
                  onClick={() => navigate(`/projects/${p.projectId}`)}
                  className="p-4 hover:bg-zinc-850/50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Project identity */}
                  <div className="space-y-1.5 min-w-0 md:w-1/3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
                        {p.projectName}
                      </span>
                      <Badge status={p.status} />
                    </div>
                    {p.techStack && (
                      <p className="text-[11px] font-mono text-zinc-500 truncate pl-4.5">
                        {p.techStack}
                      </p>
                    )}
                  </div>

                  {/* Middle: Time and Sessions stats */}
                  <div className="flex items-center gap-6 text-xs text-zinc-400 md:w-1/3">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Tracked Time</span>
                      <span className="font-mono text-zinc-200 font-semibold">
                        {formatDurationHoursMinutes(p.totalWorkingSeconds)}
                      </span>
                      <span className="text-zinc-500 text-[10px] ml-1">({p.percentageOfTotalTime}%)</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Sessions</span>
                      <span className="font-mono text-zinc-200">{p.sessionCount}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Active Days</span>
                      <span className="font-mono text-zinc-200">{p.activeDays}</span>
                    </div>
                  </div>

                  {/* Right: Task progress bar and navigation */}
                  <div className="md:w-1/3 flex items-center justify-between md:justify-end gap-4">
                    <div className="w-full max-w-[180px] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Tasks</span>
                        <span className="font-mono text-zinc-300 font-semibold">
                          {p.completedTasks}/{p.totalTasks - p.cancelledTasks} ({p.completionPercentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, p.completionPercentage)}%` }}
                        />
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
