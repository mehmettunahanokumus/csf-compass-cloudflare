import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { AssessmentComparison, Assessment } from '../types';
import { T, card, sectionLabel } from '../tokens';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ORG_ID = 'demo-org-123';

const STATUS_COLORS: Record<string, string> = {
  compliant: T.success,
  partial: T.warning,
  non_compliant: T.danger,
  not_assessed: T.textMuted,
  not_applicable: T.textMuted,
};

const STATUS_LABELS: Record<string, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
  not_applicable: 'N/A',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || T.textMuted;
  const label = STATUS_LABELS[status] || status;
  let bg = 'transparent';
  let border: string = T.border;
  if (status === 'compliant') { bg = T.successLight; border = T.successBorder; }
  else if (status === 'partial') { bg = T.warningLight; border = T.warningBorder; }
  else if (status === 'non_compliant') { bg = T.dangerLight; border = T.dangerBorder; }
  return (
    <span style={{
      fontFamily: T.fontSans, fontSize: 10, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20, color,
      background: bg, border: `1px solid ${border}`,
      display: 'inline-block',
    }}>
      {label}
    </span>
  );
}

const CSF_FUNCTION_ORDER = ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

export default function AssessmentHistoryComparison() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const a1Id = searchParams.get('assessment1');
  const a2Id = searchParams.get('assessment2');

  const [comparison, setComparison] = useState<AssessmentComparison | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sel1, setSel1] = useState(a1Id || '');
  const [sel2, setSel2] = useState(a2Id || '');
  const [loading, setLoading] = useState(false);
  const [filterChanged, setFilterChanged] = useState(false);

  useEffect(() => { loadAssessments(); }, [vendorId]);

  useEffect(() => {
    if (sel1 && sel2 && sel1 !== sel2) loadComparison();
  }, [sel1, sel2]);

  const loadAssessments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/assessments`, {
        params: { organization_id: ORG_ID, vendor_id: vendorId },
      });
      setAssessments(res.data);
    } catch {}
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/assessments/compare`, {
        params: { ids: `${sel1},${sel2}` },
      });
      setComparison(res.data);
    } catch {
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const displayedItems = filterChanged && comparison
    ? comparison.items.filter(i => i.changed)
    : comparison?.items ?? [];

  /** Per-function score breakdown for grouped bar chart */
  const functionChartData = useMemo(() => {
    if (!comparison) return [];
    const fnMap: Record<string, { baseline: number[]; current: number[] }> = {};
    for (const item of comparison.items) {
      const fn = item.subcategory_id.split('.')[0] || item.subcategory_id.split('-')[0];
      if (!fnMap[fn]) fnMap[fn] = { baseline: [], current: [] };
      const s1 = item.assessment1_status === 'compliant' ? 1 : item.assessment1_status === 'partial' ? 0.5 : 0;
      const s2 = item.assessment2_status === 'compliant' ? 1 : item.assessment2_status === 'partial' ? 0.5 : 0;
      fnMap[fn].baseline.push(s1);
      fnMap[fn].current.push(s2);
    }
    const avg = (arr: number[]) => arr.length === 0 ? 0 : Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 1000) / 10;
    return CSF_FUNCTION_ORDER
      .filter(fn => fnMap[fn])
      .map(fn => ({
        fn,
        Baseline: avg(fnMap[fn].baseline),
        Current: avg(fnMap[fn].current),
      }));
  }, [comparison]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: T.textPrimary,
    fontFamily: T.fontSans,
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textMuted, fontFamily: T.fontSans, fontSize: 13,
          padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, color: T.textPrimary, marginBottom: 6 }}>
        Historical Comparison
      </h1>
      <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, marginBottom: 28 }}>
        Compare two assessment snapshots to track progress over time
      </p>

      {/* Assessment selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>
            Baseline Assessment
          </label>
          <select value={sel1} onChange={e => setSel1(e.target.value)} style={inputStyle}>
            <option value="">Select assessment…</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
            ))}
          </select>
        </div>
        <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', paddingTop: 20 }}>
          vs
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>
            Current Assessment
          </label>
          <select value={sel2} onChange={e => setSel2(e.target.value)} style={inputStyle}>
            <option value="">Select assessment…</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontFamily: T.fontSans }}>
          Loading comparison…
        </div>
      )}

      {comparison && !loading && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              {
                label: 'Score Change',
                value: `${comparison.score_delta > 0 ? '+' : ''}${Math.round(comparison.score_delta)}%`,
                color: comparison.score_delta > 0 ? T.success : comparison.score_delta < 0 ? T.danger : T.textSecondary,
              },
              { label: 'Improved', value: comparison.summary.improved.toString(), color: T.success },
              { label: 'Declined', value: comparison.summary.declined.toString(), color: T.danger },
              { label: 'Unchanged', value: comparison.summary.unchanged.toString(), color: T.textMuted },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-function chart */}
          {functionChartData.length > 0 && (
            <div style={{ ...card, padding: 24, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2 }} />
                <span style={sectionLabel}>Score by CSF Function</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={functionChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} barCategoryGap="30%">
                  <XAxis
                    dataKey="fn"
                    tick={{ fontFamily: T.fontMono, fontSize: 11, fill: T.textMuted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontFamily: T.fontMono, fontSize: 10, fill: T.textMuted }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      background: T.card, border: `1px solid ${T.border}`,
                      borderRadius: 8, fontFamily: T.fontSans, fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`]}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}
                  />
                  <Bar dataKey="Baseline" fill="#64748B" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Current" fill="#6366F1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Filter controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setFilterChanged(!filterChanged)}
              style={{
                padding: '6px 14px', borderRadius: 6,
                border: `1px solid ${filterChanged ? T.accentBorder : T.border}`,
                background: filterChanged ? T.accentLight : 'transparent',
                color: filterChanged ? T.accent : T.textMuted,
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Show changes only
            </button>
            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
              {filterChanged
                ? `${comparison.items.filter(i => i.changed).length} changes`
                : `${comparison.items.length} total items`}
            </span>
          </div>

          {/* Items table */}
          <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 160px 56px',
              padding: '10px 20px', borderBottom: `1px solid ${T.border}`,
              background: T.bg,
            }}>
              {['Subcategory', 'Baseline', 'Current', ''].map(h => (
                <div key={h} style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  {h}
                </div>
              ))}
            </div>
            {displayedItems.map((item, idx) => (
              <div
                key={item.subcategory_id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 160px 56px',
                  padding: '10px 20px',
                  borderBottom: idx < displayedItems.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: item.delta > 0
                    ? `${T.success}08`
                    : item.delta < 0
                    ? `${T.danger}08`
                    : 'transparent',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.accent, marginBottom: 2 }}>
                    {item.subcategory_id}
                  </div>
                  <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                    {item.subcategory_name}
                  </div>
                </div>
                <div>
                  <StatusBadge status={item.assessment1_status} />
                </div>
                <div>
                  <StatusBadge status={item.assessment2_status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {item.delta > 0 && <TrendingUp size={14} style={{ color: T.success }} />}
                  {item.delta < 0 && <TrendingDown size={14} style={{ color: T.danger }} />}
                  {item.delta === 0 && <Minus size={14} style={{ color: T.textMuted }} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!comparison && !loading && sel1 && sel2 && sel1 !== sel2 && (
        <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontFamily: T.fontSans, fontSize: 13 }}>
          Failed to load comparison. Please try again.
        </div>
      )}

      {(!sel1 || !sel2) && !loading && (
        <div style={{
          textAlign: 'center', padding: 60,
          background: T.bg, border: `1px dashed ${T.border}`,
          borderRadius: 12, color: T.textMuted,
          fontFamily: T.fontSans, fontSize: 13,
        }}>
          Select two assessments above to compare them
        </div>
      )}
    </div>
  );
}
