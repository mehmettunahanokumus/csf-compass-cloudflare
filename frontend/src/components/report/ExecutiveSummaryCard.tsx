/**
 * ExecutiveSummaryCard - AI-generated executive summary display
 * Shows maturity tier, strengths, gaps, priority actions, and risk assessment
 */

import {
  CheckCircle,
  AlertTriangle,
  ListOrdered,
  ShieldAlert,
  Brain,
  Loader2,
} from 'lucide-react';

export interface ExecutiveSummaryData {
  maturityTier?: number; // 1-4
  summary?: string;
  strengths?: string[];
  criticalGaps?: string[];
  priorityActions?: string[];
  riskAssessment?: string;
}

interface ExecutiveSummaryCardProps {
  data: ExecutiveSummaryData;
  onGenerateAI?: () => void;
  isGenerating?: boolean;
}

const TIER_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: 'Partial', className: 'bg-red-500/10 text-red-400' },
  2: { label: 'Risk Informed', className: 'bg-amber-500/10 text-amber-400' },
  3: { label: 'Repeatable', className: 'bg-amber-500/10 text-amber-400' },
  4: { label: 'Adaptive', className: 'bg-emerald-500/10 text-emerald-400' },
};

export default function ExecutiveSummaryCard({
  data,
  onGenerateAI,
  isGenerating,
}: ExecutiveSummaryCardProps) {
  const hasData =
    data.summary ||
    data.strengths?.length ||
    data.criticalGaps?.length ||
    data.priorityActions?.length ||
    data.riskAssessment;

  if (!hasData) {
    return (
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h3 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Executive Summary
          </h3>
        </div>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-indigo-400/50" />
          </div>
          <p className="font-sans text-sm text-[#8E8FA8] mb-6 max-w-xs">
            No executive summary available yet. Generate one using AI analysis.
          </p>
          <button
            onClick={onGenerateAI}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Generate Executive Summary
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const tier = data.maturityTier ? TIER_CONFIG[data.maturityTier] : null;

  return (
    <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h3 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Executive Summary
          </h3>
        </div>
        {tier && (
          <span className={`font-sans text-[11px] font-semibold px-2.5 py-1 rounded-full ${tier.className}`}>
            Tier {data.maturityTier}: {tier.label}
          </span>
        )}
      </div>

      {/* Summary text */}
      {data.summary && (
        <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed mb-6">
          {data.summary}
        </p>
      )}

      {/* 2x2 section grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        {data.strengths && data.strengths.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-display text-xs font-semibold uppercase tracking-wide">
              <CheckCircle className="w-4 h-4" />
              Strengths
            </div>
            <ul className="space-y-1.5">
              {data.strengths.map((item, i) => (
                <li key={i} className="relative pl-4 font-sans text-xs text-[#8E8FA8] leading-relaxed">
                  <span className="absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Critical Gaps */}
        {data.criticalGaps && data.criticalGaps.length > 0 && (
          <div className="p-4 rounded-xl bg-red-500/[0.05] border border-red-500/10">
            <div className="flex items-center gap-2 mb-3 text-red-400 font-display text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              Critical Gaps
            </div>
            <ul className="space-y-1.5">
              {data.criticalGaps.map((item, i) => (
                <li key={i} className="relative pl-4 font-sans text-xs text-[#8E8FA8] leading-relaxed">
                  <span className="absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full bg-red-500/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Priority Actions */}
        {data.priorityActions && data.priorityActions.length > 0 && (
          <div className="p-4 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-3 text-indigo-400 font-display text-xs font-semibold uppercase tracking-wide">
              <ListOrdered className="w-4 h-4" />
              Priority Actions
            </div>
            <ol className="space-y-1.5">
              {data.priorityActions.map((item, i) => (
                <li key={i} className="relative pl-5 font-sans text-xs text-[#8E8FA8] leading-relaxed">
                  <span className="absolute left-0 font-mono text-[10px] font-bold text-indigo-400">
                    {i + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Risk Assessment */}
        {data.riskAssessment && (
          <div className="p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/10">
            <div className="flex items-center gap-2 mb-3 text-amber-400 font-display text-xs font-semibold uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4" />
              Risk Assessment
            </div>
            <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed">
              {data.riskAssessment}
            </p>
          </div>
        )}
      </div>

      {/* Regenerate button */}
      {onGenerateAI && (
        <div className="mt-5 pt-5 border-t border-white/[0.05] flex justify-end">
          <button
            onClick={onGenerateAI}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-xs rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5" />
                Regenerate
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
