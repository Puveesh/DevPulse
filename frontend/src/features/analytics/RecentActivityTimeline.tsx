import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { RecentActivityItem } from '../../types';
import { formatDurationHoursMinutes, formatDate, formatTime } from '../../lib/utils';
import { History, Play, CheckCircle2, ListPlus, FileText, ArrowRight } from 'lucide-react';

interface RecentActivityTimelineProps {
  activities: RecentActivityItem[];
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities,
}) => {
  const navigate = useNavigate();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'SESSION_COMPLETED':
        return (
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Play className="w-3.5 h-3.5 fill-current" />
          </div>
        );
      case 'SESSION_ACTIVE':
        return (
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Play className="w-3.5 h-3.5 fill-current animate-pulse" />
          </div>
        );
      case 'TASK_COMPLETED':
        return (
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        );
      case 'TASK_CREATED':
        return (
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ListPlus className="w-3.5 h-3.5" />
          </div>
        );
      case 'NOTE_SAVED':
      default:
        return (
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>Recent Development Activity</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chronological stream of recorded coding sessions, deliverable completions, and journal updates
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {activities.length} recent events
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
          No development activities recorded in this period.
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.projectId) {
                  navigate(`/projects/${item.projectId}`);
                }
              }}
              className={`p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-850 hover:border-zinc-700/80 transition-all flex items-center justify-between gap-3 ${
                item.projectId ? 'cursor-pointer group' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getActivityIcon(item.type)}
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
                      {item.title}
                    </span>
                    {item.projectName && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {item.projectName}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate max-w-lg">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-3">
                <div className="text-[11px] font-mono">
                  {item.durationSeconds != null && item.durationSeconds > 0 && (
                    <span className="text-emerald-400 font-semibold block">
                      {formatDurationHoursMinutes(item.durationSeconds)}
                    </span>
                  )}
                  <span className="text-zinc-500 block">
                    {formatDate(item.timestamp)} · {formatTime(item.timestamp)}
                  </span>
                </div>
                {item.projectId && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

