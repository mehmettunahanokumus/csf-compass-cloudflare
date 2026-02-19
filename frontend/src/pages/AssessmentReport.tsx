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

  // CSV Export — structured with function/category header rows
  const exportCSV = useCallback(() => {
    const headers = ['Function', 'Category', 'Code', 'Description', 'Status'];
    const rows: string[][] = [];

    // Group items by function then category
    const grouped: Record<string, Record<string, AssessmentItem[]>> = {};
    items.forEach((item) => {
      const funcName = item.function?.name || 'Unknown';
      const catName = item.category?.name || 'Unknown';
      if (!grouped[funcName]) grouped[funcName] = {};
      if (!grouped[funcName][catName]) grouped[funcName][catName] = [];
      grouped[funcName][catName].push(item);
    });

    for (const [funcName, categories] of Object.entries(grouped)) {
      // Function header row
      rows.push([`--- ${funcName} ---`, '', '', '', '']);
      for (const [catName, catItems] of Object.entries(categories)) {
        // Category header row
        rows.push(['', `[${catName}]`, '', '', '']);
        for (const item of catItems) {
          rows.push([
            funcName,
            catName,
            item.subcategory?.name || '',
            `"${(item.subcategory?.description || '').replace(/"/g, '""')}"`,
            item.status,
          ]);
        }
      }
    }

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (assessment?.name || 'report').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `assessment-report-${safeName}-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, id, assessment]);

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
          /* Hide navigation and interactive elements */
          nav, aside, .sidebar, [data-sidebar], .no-print, [data-no-print] {
            display: none !important;
          }

          /* Reset backgrounds for print */
          html, body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Clean up cards for print */
          * {
            box-shadow: none !important;
          }

          .print-card {
            background: #fff !important;
            border: 1px solid #d1d5db !important;
            break-inside: avoid;
          }

          .print-card h2, .print-card h3 {
            color: #111827 !important;
          }

          .print-card p, .print-card span, .print-card div, .print-card li {
            color: #374151 !important;
          }

          /* Score text stays dark */
          .print-score {
            color: #111827 !important;
          }

          /* Cover section print overrides */
          .print-cover {
            background: #fff !important;
            border: 1px solid #d1d5db !important;
          }
          .print-cover h1 { color: #111827 !important; }
          .print-cover p, .print-cover span { color: #4b5563 !important; }

          /* Section heading accent bars */
          .print-accent {
            background: #111827 !important;
          }

          /* Page breaks */
          .print-page-break {
            break-before: page;
          }

          /* A4 margins */
          @page {
            size: A4;
            margin: 1.5cm;
          }
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
                Export Excel (.csv)
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Cover Section (visible in print and screen) */}
        {assessment && (
          <div className="print-cover bg-[#0E1018] border border-white/[0.07] rounded-xl p-8 mb-6 text-center">
            <h1 className="font-display text-3xl font-bold text-[#F0F0F5] mb-2">
              {assessment.name}
            </h1>
            {assessment.vendor && (
              <p className="font-sans text-lg text-amber-400 mb-1">
                {assessment.vendor.name}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 mt-4 font-sans text-sm text-[#8E8FA8]">
              <span>NIST CSF 2.0 Assessment</span>
              <span className="w-1 h-1 rounded-full bg-[#55576A]" />
              <span>
                {assessment.completed_at
                  ? new Date(assessment.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : new Date(assessment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#55576A]" />
              <span className="capitalize">{assessment.status}</span>
            </div>
          </div>
        )}

        {/* Compliance Overview */}
        <div className="print-card bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5 border-b border-white/[0.05] pb-4">
            <div className="print-accent w-[3px] h-5 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-sm font-semibold tracking-[0.08em] uppercase text-[#8E8FA8]">
              Compliance Overview
            </h2>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-8 items-center">
            {/* SVG Compliance Circle — larger */}
            <div className="relative w-[220px] h-[220px] flex-shrink-0">
              <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
                <circle
                  cx="110" cy="110" r="95"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="18"
                />
                <circle
                  cx="110" cy="110" r="95"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="18"
                  strokeDasharray={`${2 * Math.PI * 95}`}
                  strokeDashoffset={`${2 * Math.PI * 95 * (1 - complianceScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="print-score font-display text-5xl font-bold tabular-nums text-[#F0F0F5]">
                  {Math.round(complianceScore)}
                </span>
                <span className="font-sans text-xs text-[#55576A] uppercase tracking-widest mt-1">Score</span>
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
        <div className="print-card bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5 border-b border-white/[0.05] pb-4">
            <div className="print-accent w-[3px] h-5 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-sm font-semibold tracking-[0.08em] uppercase text-[#8E8FA8]">
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
        <div className="print-page-break" />
        <ExecutiveSummaryCard
          data={summaryData}
          onGenerateAI={generateSummary}
          isGenerating={isGeneratingSummary}
        />
      </div>
    </>
  );
}
