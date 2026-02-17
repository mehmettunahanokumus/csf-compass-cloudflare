/**
 * AssessmentReport - Printable report view for an assessment
 * Shows compliance overview, function scores, executive summary, and CSV export
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileDown, Printer } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { aiApi } from '../api/ai';
import type { GenerateExecutiveSummaryRequest } from '../api/ai';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import ExecutiveSummaryCard from '../components/report/ExecutiveSummaryCard';
import type { ExecutiveSummaryData } from '../components/report/ExecutiveSummaryCard';

export default function AssessmentReport() {
  const { id } = useParams<{ id: string }>();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [_functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData>({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [assessmentData, functionsData, itemsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
        assessmentsApi.getItems(id),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      setItems(itemsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Distribution stats
  const distribution = useMemo(() => {
    const d = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, not_applicable: 0 };
    items.forEach((item) => {
      if (item.status in d) d[item.status as keyof typeof d]++;
    });
    return d;
  }, [items]);

  const complianceScore = useMemo(() => {
    const assessed = items.filter(
      (i) => i.status !== 'not_assessed' && i.status !== 'not_applicable'
    ).length;
    if (assessed === 0) return 0;
    return (distribution.compliant / assessed) * 100;
  }, [items, distribution]);

  // Score per function
  const functionScores = useMemo(() => {
    const funcMap: Record<
      string,
      { id: string; name: string; code: string; compliant: number; partial: number; non_compliant: number; total: number }
    > = {};

    items.forEach((item) => {
      const funcId = item.function?.id || 'unknown';
      const funcName = item.function?.name || 'Unknown';
      if (!funcMap[funcId]) {
        funcMap[funcId] = { id: funcId, name: funcName, code: funcName.substring(0, 2).toUpperCase(), compliant: 0, partial: 0, non_compliant: 0, total: 0 };
      }
      funcMap[funcId].total++;
      if (item.status === 'compliant') funcMap[funcId].compliant++;
      else if (item.status === 'partial') funcMap[funcId].partial++;
      else if (item.status === 'non_compliant') funcMap[funcId].non_compliant++;
    });

    return Object.values(funcMap).sort((a, b) => a.code.localeCompare(b.code));
  }, [items]);

  // CSV Export
  const exportCSV = useCallback(() => {
    const headers = ['Code', 'Description', 'Status', 'Function', 'Category'];
    const rows = items.map((item) => [
      item.subcategory?.name || '',
      `"${(item.subcategory?.description || '').replace(/"/g, '""')}"`,
      item.status,
      item.function?.name || '',
      item.category?.name || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-report-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, id]);

  // Generate AI executive summary
  const generateSummary = useCallback(async () => {
    if (!id || !assessment) return;
    setIsGeneratingSummary(true);

    try {
      const topGaps = items
        .filter((i) => i.status === 'non_compliant')
        .slice(0, 10)
        .map((i) => ({
          subcategoryCode: i.subcategory?.name || '',
          description: i.subcategory?.description || '',
          functionCode: i.function?.name?.substring(0, 2).toUpperCase() || '',
        }));

      const request: GenerateExecutiveSummaryRequest = {
        assessment_id: id,
        organization_name: 'Organization',
        industry: 'Technology',
        overall_score: Math.round(complianceScore),
        function_scores: functionScores.map((fs) => ({
          code: fs.code,
          name: fs.name,
          score: fs.total > 0 ? Math.round((fs.compliant / fs.total) * 100) : 0,
          compliant: fs.compliant,
          partial: fs.partial,
          non_compliant: fs.non_compliant,
          total: fs.total,
        })),
        distribution: {
          compliant: distribution.compliant,
          partial: distribution.partial,
          non_compliant: distribution.non_compliant,
          not_assessed: distribution.not_assessed,
          not_applicable: distribution.not_applicable,
        },
        top_gaps: topGaps,
      };

      const response = await aiApi.generateExecutiveSummary(request);

      if (response.success && response.summary) {
        const strengths =
          Array.isArray(response.summary.top_strengths)
            ? response.summary.top_strengths
            : typeof response.summary.top_strengths === 'string'
              ? JSON.parse(response.summary.top_strengths as string)
              : [];

        const gaps =
          Array.isArray(response.summary.top_gaps)
            ? response.summary.top_gaps
            : typeof response.summary.top_gaps === 'string'
              ? JSON.parse(response.summary.top_gaps as string)
              : [];

        setSummaryData({
          maturityTier: response.summary.maturity_tier,
          summary: response.summary.summary_text,
          strengths,
          criticalGaps: gaps,
          priorityActions: [],
          riskAssessment: '',
        });
      }
    } catch (err) {
      console.error('Failed to generate summary:', getErrorMessage(err));
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [id, assessment, items, complianceScore, functionScores, distribution]);

  const scoreColor = complianceScore >= 75 ? '#10B981' : complianceScore >= 50 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 80;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-white/[0.06] rounded" />
        <div className="h-8 w-48 bg-white/[0.06] rounded" />
        <div className="h-60 w-full bg-white/[0.06] rounded-xl" />
        <div className="h-72 w-full bg-white/[0.06] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center py-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="font-sans text-sm text-red-400">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const statBoxes = [
    { label: 'Compliant', count: distribution.compliant, color: '#10B981' },
    { label: 'Partially Compliant', count: distribution.partial, color: '#F59E0B' },
    { label: 'Non-Compliant', count: distribution.non_compliant, color: '#EF4444' },
    { label: 'Not Assessed', count: distribution.not_assessed, color: '#55576A' },
  ];

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          nav, .no-print, [data-no-print] { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          * { box-shadow: none !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-6 animate-fade-in-up">
        {/* Header (hidden in print) */}
        <div className="no-print mb-6">
          <Link
            to={`/assessments/${id}`}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-[#55576A] hover:text-[#8E8FA8] transition-colors mb-3"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Assessment
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">
                Assessment Report
              </h1>
              {assessment && (
                <p className="font-sans text-sm text-[#8E8FA8] mt-0.5">{assessment.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all"
              >
                <FileDown className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Compliance Overview
            </h2>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-8 items-center">
            {/* SVG Compliance Circle */}
            <div className="relative w-[180px] h-[180px] flex-shrink-0">
              <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                <circle
                  cx="90" cy="90" r="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="16"
                />
                <circle
                  cx="90" cy="90" r="80"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="16"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${circumference * (1 - complianceScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="font-display text-4xl font-bold tabular-nums text-[#F0F0F5]">
                  {Math.round(complianceScore)}
                </span>
                <span className="font-sans text-[10px] text-[#55576A] uppercase tracking-widest mt-0.5">Score</span>
              </div>
            </div>

            {/* Stat boxes */}
            <div className="grid grid-cols-2 gap-3">
              {statBoxes.map((stat) => (
                <div
                  key={stat.label}
                  className="border-l-[3px] pl-4 py-2 bg-white/[0.02] rounded-r-lg"
                  style={{ borderColor: stat.color }}
                >
                  <div className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-0.5">
                    {stat.label}
                  </div>
                  <div className="font-display text-2xl font-bold tabular-nums text-[#F0F0F5]">
                    {stat.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score by Function */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Score by Function
            </h2>
          </div>

          <div className="space-y-4">
            {functionScores.map((fs) => {
              const score = fs.total > 0 ? Math.round((fs.compliant / fs.total) * 100) : 0;
              const barColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

              return (
                <div key={fs.id} className="grid grid-cols-[56px_1fr_48px] gap-3 items-center">
                  {/* Code badge */}
                  <span className="font-mono text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md text-center">
                    {fs.code}
                  </span>

                  {/* Bar container */}
                  <div>
                    <div className="font-sans text-xs text-[#8E8FA8] mb-1.5">{fs.name}</div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, background: barColor }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <span className={`font-mono text-sm font-bold tabular-nums text-right ${
                    score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Summary */}
        <ExecutiveSummaryCard
          data={summaryData}
          onGenerateAI={generateSummary}
          isGenerating={isGeneratingSummary}
        />
      </div>
    </>
  );
}
