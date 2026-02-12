/**
 * AssessmentReport - Printable report view for an assessment
 * Shows compliance overview, function scores, executive summary, and CSV export
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Printer } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { aiApi } from '../api/ai';
import type { GenerateExecutiveSummaryRequest } from '../api/ai';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import ExecutiveSummaryCard from '../components/report/ExecutiveSummaryCard';
import type { ExecutiveSummaryData } from '../components/report/ExecutiveSummaryCard';
import Skeleton from '../components/Skeleton.new';

/** Simple SVG compliance circle */
function ComplianceCircle({ score, size = 200 }: { score: number; size?: number }) {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--orange)' : 'var(--red)';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-1)"
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          transform: 'rotate(90deg)',
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      >
        {Math.round(score)}%
      </text>
    </svg>
  );
}

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

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton w="200px" h="32px" />
        <Skeleton w="100%" h="240px" />
        <Skeleton w="100%" h="300px" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--red-text)',
          fontSize: 14,
        }}
      >
        <p style={{ marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadData}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: 14,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const statBoxes = [
    { label: 'Compliant', count: distribution.compliant, borderColor: 'var(--green)' },
    { label: 'Partially Compliant', count: distribution.partial, borderColor: 'var(--orange)' },
    { label: 'Non-Compliant', count: distribution.non_compliant, borderColor: 'var(--red)' },
    { label: 'Not Assessed', count: distribution.not_assessed, borderColor: 'var(--gray)' },
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {/* Header (hidden in print) */}
        <div className="no-print" style={{ marginBottom: 24 }}>
          <Link
            to={`/assessments/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-3)',
              textDecoration: 'none',
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            <ArrowLeft size={16} />
            Back to Assessment
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-1)',
              }}
            >
              Assessment Report
            </h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={exportCSV}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <FileDown size={16} />
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'var(--navy-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 14,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 600,
                }}
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            padding: 24,
            marginBottom: 24,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <ComplianceCircle score={complianceScore} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {statBoxes.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '12px 16px',
                  borderLeft: `3px solid ${stat.borderColor}`,
                  background: 'var(--ground)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {stat.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score by Function */}
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-1)',
              marginBottom: 20,
            }}
          >
            Score by Function
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {functionScores.map((fs) => {
              const score = fs.total > 0 ? Math.round((fs.compliant / fs.total) * 100) : 0;
              const barColor =
                score >= 75
                  ? 'var(--green)'
                  : score >= 50
                    ? 'var(--orange)'
                    : score >= 25
                      ? 'var(--orange)'
                      : 'var(--red)';

              return (
                <div
                  key={fs.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 50px',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  {/* Code badge */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      textAlign: 'center',
                    }}
                  >
                    {fs.code}
                  </span>

                  {/* Bar container */}
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-3)',
                        marginBottom: 4,
                      }}
                    >
                      {fs.name}
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: 'var(--ground)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${score}%`,
                          background: barColor,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      textAlign: 'right',
                    }}
                  >
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
