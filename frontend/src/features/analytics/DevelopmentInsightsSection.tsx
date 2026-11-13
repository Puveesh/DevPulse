import React from 'react';
import type { AnalyticsInsight } from '../../types';
import { Lightbulb, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DevelopmentInsightsSectionProps {
  insights: AnalyticsInsight[];
}

export const DevelopmentInsightsSection: React.FC<DevelopmentInsightsSectionProps> = ({
  insights,
}) => {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'WARNING':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'INFO':
      default:
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Developer Insights & Observations</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deterministic data-driven observations derived from your actual development logs
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {insights.map((item, idx) => (
          <div
            key={`insight-${idx}`}
            className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2 hover:border-zinc-750 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {getIcon(item.level)}
                <h4 className="text-xs font-semibold text-zinc-200 leading-tight">
                  {item.title}
                </h4>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${getBadgeStyle(
                  item.level
                )}`}
              >
                {item.category.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pl-6">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

