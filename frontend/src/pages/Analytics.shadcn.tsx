import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, AlertCircle,
  Shield, CheckCircle2, Clock, Minus, Calendar, ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, Cell,
} from 'recharts';
import axios from 'axios';
import type { Assessment, Vendor, AssessmentItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ORG_ID = 'demo-org-123';

// ── Date range helpers ────────────────────────────────────────────

type RangeKey = '7d' | '30d' | '90d' | '12m' | 'custom';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7d',     label: 'Last 7 days'    },
  { key: '30d',    label: 'Last 30 days'   },
  { key: '90d',    label: 'Last 90 days'   },
  { key: '12m',    label: 'Last 12 months' },
  { key: 'custom', label: 'Custom range'   },
];

function getRangeDates(key: RangeKey, customFrom?: string, customTo?: string) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  if (key === 'custom') {
    return {
      from: customFrom ? new Date(customFrom).getTime() : now - 30 * DAY,
      to:   customTo   ? new Date(customTo).getTime() + DAY - 1 : now,
    };
  }
  const days = key === '7d' ? 7 : key === '30d' ? 30 : key === '90d' ? 90 : 365;
  return { from: now - days * DAY, to: now };
}

// ── Data derivation helpers ───────────────────────────────────────

const CSF_ORDER = ['GV', 'ID', 'PR', 'DE', 'RS', 'RC'];
const CSF_NAMES: Record<string, string> = {
  GV: 'Govern', ID: 'Identify', PR: 'Protect',
  DE: 'Detect',  RS: 'Respond', RC: 'Recover',
};

function scoreColor(s: number) {
  if (s >= 70) return '#16A34A';
  if (s >= 50) return '#D97706';
  return '#DC2626';
}
function riskColor(r: string) {
  if (r === 'Critical') return '#DC2626';
  if (r === 'High')     return '#D97706';
  if (r === 'Medium')   return '#EAB308';
  return '#16A34A';
}

function buildTrendData(orgA: Assessment[], vendorA: Assessment[]) {
  const monthMap: Record<string, { label: string; orgScores: number[]; vendorScores: number[] }> = {};
  const add = (a: Assessment, isVendor: boolean) => {
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) {
      monthMap[key] = { label: d.toLocaleString('default', { month: 'short' }), orgScores: [], vendorScores: [] };
    }
    if (a.overall_score != null) {
      if (isVendor) monthMap[key].vendorScores.push(a.overall_score);
      else          monthMap[key].orgScores.push(a.overall_score);
    }
  };
  orgA.forEach(a => add(a, false));
  vendorA.forEach(a => add(a, true));

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { label, orgScores, vendorScores }]) => ({
      month:  label,
      org:    avg(orgScores),
      vendor: avg(vendorScores),
    }));
}

function buildRadarData(items: AssessmentItem[]) {
  const fnMap: Record<string, { name: string; scores: number[] }> = {};
  for (const item of items) {
    const fnId = item.function?.id;
    if (!fnId) continue;
    if (!fnMap[fnId]) fnMap[fnId] = { name: CSF_NAMES[fnId] || fnId, scores: [] };
    const s = item.status === 'compliant'     ? 100
            : item.status === 'partial'       ?  50
            : item.status === 'non_compliant' ?   0
            : null;
    if (s !== null) fnMap[fnId].scores.push(s);
  }
  return CSF_ORDER
    .filter(id => fnMap[id])
    .map(id => ({
      function: fnMap[id].name,
      score:    fnMap[id].scores.length > 0
                  ? Math.round(fnMap[id].scores.reduce((a, b) => a + b, 0) / fnMap[id].scores.length)
                  : 0,
      fullMark: 100,
    }));
}

function buildGapData(items: AssessmentItem[]) {
  const catMap: Record<string, { name: string; gaps: number }> = {};
  for (const item of items) {
    if (item.status !== 'non_compliant' && item.status !== 'partial') continue;
    const catId   = item.category?.id;
    const catName = item.category?.name;
    if (!catId) continue;
    if (!catMap[catId]) catMap[catId] = { name: catName || catId, gaps: 0 };
    catMap[catId].gaps++;
  }
  return Object.values(catMap)
    .sort((a, b) => b.gaps - a.gaps)
    .slice(0, 5)
    .map(c => ({ category: c.name, gaps: c.gaps }));
}

function buildVendorRiskData(vendors: Vendor[], vendorAssessments: Assessment[]) {
  const scoreMap: Record<string, { name: string; score: number | null }> = {};
  for (const v of vendors) scoreMap[v.id] = { name: v.name, score: null };

  const sorted = [...vendorAssessments].sort((a, b) => b.created_at - a.created_at);
  for (const a of sorted) {
    if (a.vendor_id && scoreMap[a.vendor_id] && scoreMap[a.vendor_id].score === null && a.overall_score != null) {
      scoreMap[a.vendor_id].score = a.overall_score;
    }
  }
  return Object.values(scoreMap)
    .filter(v => v.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 5)
    .map(v => ({
      name:  v.name,
      score: v.score!,
      risk:  v.score! < 40 ? 'Critical' : v.score! < 60 ? 'High' : v.score! < 75 ? 'Medium' : 'Low',
    }));
}

// ── UI helpers ────────────────────────────────────────────────────

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
      padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: '#4F46E5', flexShrink: 0 }} />
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#94A3B8' }}>
        {children}
      </span>
    </div>
  );
}

function SkeletonBox({ w, h, mt = 0 }: { w?: string; h: number; mt?: number }) {
  return (
    <div style={{
      width: w ?? '100%', height: h, borderRadius: 6, marginTop: mt,
      background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
      backgroundSize: '200% 100%',
      animation: 'analytics-shimmer 1.5s infinite',
    }} />
  );
}

function ChartLoader({ height = 200 }: { height?: number }) {
  return (
    <div style={{ height, background: '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid #E2E8F0', borderTopColor: '#4F46E5',
          animation: 'analytics-spin 0.8s linear infinite',
          margin: '0 auto 8px',
        }} />
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8' }}>Loading…</div>
      </div>
    </div>
  );
}

function EmptyChart({ height = 200, message = 'No data for this period' }: { height?: number; message?: string }) {
  return (
    <div style={{
      height, background: '#F8FAFC', borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: '1px dashed #CBD5E1',
    }}>
      <BarChart3 size={26} style={{ color: '#CBD5E1', marginBottom: 8 }} />
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8' }}>{message}</div>
    </div>
  );
}

function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>{label}</div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 700, color: '#4F46E5' }}>{payload[0].value}</div>
    </div>
  );
}

function LineTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(15,23,42,0.1)', fontFamily: 'Manrope, sans-serif' }}>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#64748B', fontWeight: 500 }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16 }}>
            {p.value != null ? `${p.value}%` : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export default function Analytics() {
  // Date range state
  const [range,       setRange]       = useState<RangeKey>('30d');
  const [customFrom,  setCustomFrom]  = useState('');
  const [customTo,    setCustomTo]    = useState('');
  const [showDrop,    setShowDrop]    = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Raw API data
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [allVendors,     setAllVendors]     = useState<Vendor[]>([]);
  const [latestItems,    setLatestItems]    = useState<AssessmentItem[]>([]);

  // Loading / error
  const [loading,      setLoading]      = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Stale-fetch guard
  const fetchIdRef = useRef(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Initial load: assessments + vendors ──────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aRes, vRes] = await Promise.all([
          axios.get(`${API_URL}/api/assessments`, { params: { organization_id: ORG_ID } }),
          axios.get(`${API_URL}/api/vendors`,     { params: { organization_id: ORG_ID, exclude_grouped: 'true' } }),
        ]);
        if (!cancelled) {
          setAllAssessments(aRes.data);
          setAllVendors(vRes.data);
        }
      } catch {
        if (!cancelled) setError('Failed to load analytics data. Please refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Derived: filtered by date range ──────────────────────────
  const { from, to } = useMemo(
    () => getRangeDates(range, customFrom, customTo),
    [range, customFrom, customTo],
  );

  const filteredAssessments = useMemo(
    () => allAssessments.filter(a => a.created_at >= from && a.created_at <= to),
    [allAssessments, from, to],
  );

  // assessment_type field as returned by the API
  const filteredOrgA = useMemo(
    () => filteredAssessments.filter(a =>
      a.assessment_type === 'organization' || (a as any).type === 'organization',
    ),
    [filteredAssessments],
  );

  const filteredVendorA = useMemo(
    () => filteredAssessments.filter(a =>
      a.assessment_type === 'vendor' || (a as any).type === 'vendor',
    ),
    [filteredAssessments],
  );

  // Latest org assessment in range → used for radar + gaps
  const latestOrgAssessment = useMemo(
    () => [...filteredOrgA].sort((a, b) => b.created_at - a.created_at)[0] ?? null,
    [filteredOrgA],
  );

  // ── Load items for latest org assessment ─────────────────────
  useEffect(() => {
    if (!latestOrgAssessment) {
      setLatestItems([]);
      return;
    }
    const myId = ++fetchIdRef.current;
    let cancelled = false;
    setItemsLoading(true);

    axios.get(`${API_URL}/api/assessments/${latestOrgAssessment.id}/items`)
      .then(res => {
        if (!cancelled && fetchIdRef.current === myId) setLatestItems(res.data);
      })
      .catch(() => {
        if (!cancelled && fetchIdRef.current === myId) setLatestItems([]);
      })
      .finally(() => {
        if (!cancelled && fetchIdRef.current === myId) setItemsLoading(false);
      });

    return () => { cancelled = true; };
  }, [latestOrgAssessment?.id]);

  // ── Chart data (all reactive to range) ───────────────────────
  const trendData      = useMemo(() => buildTrendData(filteredOrgA, filteredVendorA), [filteredOrgA, filteredVendorA]);
  const radarData      = useMemo(() => buildRadarData(latestItems), [latestItems]);
  const gapData        = useMemo(() => buildGapData(latestItems), [latestItems]);
  const vendorRiskData = useMemo(() => buildVendorRiskData(allVendors, filteredVendorA), [allVendors, filteredVendorA]);

  const hasData = filteredAssessments.length > 0;

  // KPIs
  const avgScore = useMemo(() => {
    const scored = filteredAssessments.filter(a => a.overall_score != null);
    return scored.length > 0
      ? Math.round(scored.reduce((s, a) => s + (a.overall_score ?? 0), 0) / scored.length)
      : null;
  }, [filteredAssessments]);

  const prevPeriodScore = useMemo(() => {
    const duration = to - from;
    const prev = allAssessments.filter(a =>
      a.created_at >= from - duration && a.created_at < from && a.overall_score != null,
    );
    return prev.length > 0
      ? Math.round(prev.reduce((s, a) => s + (a.overall_score ?? 0), 0) / prev.length)
      : null;
  }, [allAssessments, from, to]);

  const completedCount  = filteredAssessments.filter(a => a.status === 'completed').length;
  const inProgressCount = filteredAssessments.filter(a => a.status === 'in_progress').length;
  const openGaps        = latestItems.filter(i => i.status === 'non_compliant').length;
  const highRiskCount   = vendorRiskData.filter(v => v.risk === 'High' || v.risk === 'Critical').length;
  const delta           = avgScore !== null && prevPeriodScore !== null ? avgScore - prevPeriodScore : null;

  const kpis = [
    {
      label: 'Avg Compliance',
      value: avgScore !== null ? `${avgScore}%` : '—',
      color: avgScore !== null ? scoreColor(avgScore) : '#94A3B8',
      icon:  <Shield size={16} />,
      sub:   delta !== null
               ? delta > 0
                 ? <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: 3 }}><TrendingUp size={12} />+{delta}% vs prev period</span>
                 : delta < 0
                 ? <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: 3 }}><TrendingDown size={12} />{delta}% vs prev period</span>
                 : <span style={{ color: '#94A3B8' }}>No change vs prev period</span>
               : <span style={{ color: '#94A3B8' }}>No previous data</span>,
    },
    {
      label: 'Assessments Done',
      value: completedCount.toString(),
      color: '#4F46E5',
      icon:  <CheckCircle2 size={16} />,
      sub:   <span style={{ color: '#94A3B8' }}>{inProgressCount} in progress</span>,
    },
    {
      label: 'Open Gaps',
      value: openGaps.toString(),
      color: openGaps > 0 ? '#D97706' : '#16A34A',
      icon:  <AlertCircle size={16} />,
      sub:   <span style={{ color: '#94A3B8' }}>Non-compliant items</span>,
    },
    {
      label: 'High-Risk Vendors',
      value: highRiskCount.toString(),
      color: highRiskCount > 0 ? '#DC2626' : '#16A34A',
      icon:  <Clock size={16} />,
      sub:   <span style={{ color: '#94A3B8' }}>Score below 60%</span>,
    },
  ];

  const rangeLabel = RANGE_OPTIONS.find(o => o.key === range)?.label ?? 'Select range';

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{ANIM_CSS}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[0,1,2,3].map(i => (
            <Card key={i}>
              <SkeletonBox h={32} w="80px" />
              <SkeletonBox h={42} w="60px" mt={12} />
              <SkeletonBox h={14} w="100px" mt={8} />
            </Card>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
          <Card><SectionTitle>CSF Function Maturity</SectionTitle><ChartLoader height={220} /></Card>
          <Card><SectionTitle>Compliance Trend</SectionTitle><ChartLoader height={200} /></Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#DC2626', fontFamily: 'Manrope, sans-serif', fontSize: 14 }}>
        {error}
      </div>
    );
  }

  return (
    <>
      <style>{ANIM_CSS}</style>

      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Analytics
            </h1>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
              Compliance trends, risk visualization & gap analysis
            </p>
          </div>

          {/* Date range dropdown */}
          <div ref={dropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDrop(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8,
                background: '#fff', border: `1px solid ${showDrop ? '#6366F1' : '#E2E8F0'}`,
                fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: '#0F172A',
                cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
              }}
            >
              <Calendar size={14} style={{ color: '#4F46E5' }} />
              {rangeLabel}
              <ChevronDown size={14} style={{ color: '#94A3B8', transition: 'transform 0.15s', transform: showDrop ? 'rotate(180deg)' : 'none' }} />
            </button>

            {showDrop && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)', zIndex: 40, minWidth: 190, overflow: 'hidden',
              }}>
                {RANGE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setRange(opt.key);
                      if (opt.key !== 'custom') setShowDrop(false);
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 16px', background: range === opt.key ? '#EEF2FF' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif', fontSize: 13,
                      fontWeight: range === opt.key ? 700 : 500,
                      color: range === opt.key ? '#4F46E5' : '#374151',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}

                {/* Custom date inputs */}
                {range === 'custom' && (
                  <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['from', 'to'] as const).map(field => (
                        <div key={field}>
                          <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 4 }}>
                            {field === 'from' ? 'FROM' : 'TO'}
                          </label>
                          <input
                            type="date"
                            value={field === 'from' ? customFrom : customTo}
                            onChange={e => field === 'from' ? setCustomFrom(e.target.value) : setCustomTo(e.target.value)}
                            style={{
                              width: '100%', padding: '5px 8px', borderRadius: 6,
                              border: '1px solid #E2E8F0', fontSize: 12,
                              fontFamily: 'Manrope, sans-serif', color: '#0F172A', outline: 'none',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowDrop(false)}
                      style={{
                        marginTop: 10, width: '100%', padding: '7px',
                        background: '#4F46E5', border: 'none', borderRadius: 6,
                        color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── No data banner ── */}
        {!hasData && !itemsLoading && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10,
            padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#92400E',
          }}>
            <AlertCircle size={16} />
            No assessments found for this period. Try a wider date range.
          </div>
        )}

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {kpis.map((k, i) => (
            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <Card>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, marginBottom: 12,
                  background: `${k.color}12`, border: `1px solid ${k.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color,
                }}>
                  {k.icon}
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 34, fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: 2 }}>
                  {k.value}
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>
                  {k.label}
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11 }}>{k.sub}</div>
              </Card>
            </div>
          ))}
        </div>

        {/* ── Radar + Trend row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>

          {/* Radar */}
          <Card>
            <SectionTitle>CSF Function Maturity</SectionTitle>
            {itemsLoading ? (
              <ChartLoader height={220} />
            ) : radarData.length === 0 ? (
              <EmptyChart height={220} message={!hasData ? 'No data for this period' : 'No assessment items found'} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis
                      dataKey="function"
                      tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, fill: '#64748B' }}
                    />
                    <Radar
                      name="Score" dataKey="score"
                      stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 4 }}>
                  {radarData.map(d => (
                    <div key={d.function} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: scoreColor(d.score) }} />
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                        {d.function} <strong style={{ color: scoreColor(d.score) }}>{d.score}%</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Trend line */}
          <Card>
            <SectionTitle>Compliance Trend</SectionTitle>
            {trendData.length === 0 ? (
              <EmptyChart height={200} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
                    <defs>
                      <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="vendorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<LineTip />} />
                    <Area type="monotone" dataKey="org"    name="Organization" stroke="#4F46E5" fill="url(#orgGrad)"    strokeWidth={2.5} dot={{ r: 3, fill: '#4F46E5' }} activeDot={{ r: 5 }} connectNulls />
                    <Area type="monotone" dataKey="vendor" name="Avg Vendor"   stroke="#16A34A" fill="url(#vendorGrad)" strokeWidth={2}   dot={{ r: 3, fill: '#16A34A' }} activeDot={{ r: 5 }} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  {[{ color: '#4F46E5', label: 'Organization' }, { color: '#16A34A', label: 'Avg Vendor' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 3, borderRadius: 2, background: l.color }} />
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, color: '#64748B' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Vendor risk + Gap analysis ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Vendor risk scores */}
          <Card>
            <SectionTitle>Vendor Risk Scores</SectionTitle>
            {vendorRiskData.length === 0 ? (
              <EmptyChart height={160} message="No vendor assessment data for this period" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vendorRiskData.map(v => (
                  <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 110, fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: '#0F172A', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {v.name}
                    </div>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ width: `${v.score}%`, height: '100%', borderRadius: 3, background: scoreColor(v.score), transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ width: 36, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: scoreColor(v.score), textAlign: 'right' as const, flexShrink: 0 }}>
                      {v.score}
                    </div>
                    <div style={{ padding: '2px 8px', borderRadius: 100, fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, background: `${riskColor(v.risk)}12`, color: riskColor(v.risk), flexShrink: 0, width: 60, textAlign: 'center' as const }}>
                      {v.risk}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top gaps */}
          <Card>
            <SectionTitle>Top Compliance Gaps</SectionTitle>
            {itemsLoading ? (
              <ChartLoader height={200} />
            ) : gapData.length === 0 ? (
              <EmptyChart
                height={200}
                message={
                  !hasData
                    ? 'No data for this period'
                    : latestOrgAssessment
                    ? 'No gaps found — great compliance!'
                    : 'No org assessment data in range'
                }
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gapData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="category" width={115} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                    <Bar dataKey="gaps" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Minus size={12} style={{ color: '#EF4444' }} />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#94A3B8' }}>
                    Total <strong style={{ color: '#0F172A' }}>{openGaps} open gaps</strong> across latest assessment
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Score by CSF Function (bar) ── */}
        <Card>
          <SectionTitle>Score by CSF Function</SectionTitle>
          {itemsLoading ? (
            <ChartLoader height={160} />
          ) : radarData.length === 0 ? (
            <EmptyChart height={160} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={radarData} barSize={40} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="function" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
                <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                  {radarData.map((entry, index) => (
                    <Cell key={index} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

      </div>
    </>
  );
}

const ANIM_CSS = `
  @keyframes analytics-shimmer {
    from { background-position:  200% 0; }
    to   { background-position: -200% 0; }
  }
  @keyframes analytics-spin {
    to { transform: rotate(360deg); }
  }
`;
