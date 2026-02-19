/**
 * AssessmentReport — Professional report view for an assessment
 * Sections: Header · Executive Summary · CSF Function Breakdown · Findings Table
 * Exports: PDF (browser print) · Excel (SheetJS xlsx)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, FileDown, Download,
  ChevronDown, ChevronUp, ChevronsUpDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import { T, card } from '../tokens';

// ─── small helpers ────────────────────────────────────────────────────────────

function scoreColorOf(score: number) {
  return score >= 75 ? T.success : score >= 50 ? T.warning : T.danger;
}

function statusBadge(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 20, display: 'inline-block',
  };
  switch (status) {
    case 'compliant':     return { ...base, background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` };
    case 'partial':       return { ...base, background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` };
    case 'non_compliant': return { ...base, background: T.dangerLight,  color: T.danger,  border: `1px solid ${T.dangerBorder}`  };
    default:              return { ...base, background: T.bg,            color: T.textMuted, border: `1px solid ${T.border}`     };
  }
}

function statusLabel(status: string) {
  return (
    { compliant: 'Compliant', partial: 'Partial', non_compliant: 'Non-Compliant', not_assessed: 'Not Assessed', not_applicable: 'N/A' }
    [status] ?? status
  );
}

function CardHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
        <span style={{
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted,
        }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AssessmentReport() {
  const { id } = useParams<{ id: string }>();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [_functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<'id' | 'status' | 'name'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true); setError(null);
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

  // ── distributions ──────────────────────────────────────────────────────────
  const distribution = useMemo(() => {
    const d = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, not_applicable: 0 };
    items.forEach((item) => { if (item.status in d) d[item.status as keyof typeof d]++; });
    return d;
  }, [items]);

  const overallScore = useMemo(() => {
    const assessed = items.filter(i => i.status !== 'not_assessed' && i.status !== 'not_applicable').length;
    return assessed === 0 ? 0 : (distribution.compliant / assessed) * 100;
  }, [items, distribution]);

  // ── function breakdown with nested categories ──────────────────────────────
  const functionBreakdown = useMemo(() => {
    const map: Record<string, {
      id: string; name: string;
      compliant: number; partial: number; non_compliant: number; not_assessed: number; total: number;
      categories: Record<string, { id: string; name: string; items: AssessmentItem[] }>;
    }> = {};

    items.forEach(item => {
      const fId = item.function?.id || 'unknown';
      const fName = item.function?.name || 'Unknown';
      const cId = item.category?.id || 'unknown';
      const cName = item.category?.name || 'Unknown';

      if (!map[fId]) map[fId] = { id: fId, name: fName, compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, total: 0, categories: {} };
      map[fId].total++;
      if      (item.status === 'compliant')    map[fId].compliant++;
      else if (item.status === 'partial')       map[fId].partial++;
      else if (item.status === 'non_compliant') map[fId].non_compliant++;
      else                                       map[fId].not_assessed++;

      if (!map[fId].categories[cId]) map[fId].categories[cId] = { id: cId, name: cName, items: [] };
      map[fId].categories[cId].items.push(item);
    });

    return Object.values(map).sort((a, b) => a.id.localeCompare(b.id));
  }, [items]);

  // ── findings (non-compliant + partial), sortable ───────────────────────────
  const findings = useMemo(() => {
    const raw = items.filter(i => i.status === 'non_compliant' || i.status === 'partial');
    return [...raw].sort((a, b) => {
      let av = '', bv = '';
      if (sortCol === 'id')     { av = a.subcategory?.id   || ''; bv = b.subcategory?.id   || ''; }
      if (sortCol === 'status') { av = a.status             || ''; bv = b.status             || ''; }
      if (sortCol === 'name')   { av = a.subcategory?.name || ''; bv = b.subcategory?.name || ''; }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [items, sortCol, sortDir]);

  // ── Excel export ───────────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Summary
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Assessment Report', assessment?.name || ''],
      ['Generated', new Date().toLocaleDateString()],
      ['Overall Score', `${Math.round(overallScore)}%`],
      [],
      ['Metric', 'Count', '% of Total'],
      ['Total Controls',      items.length,               '100%'],
      ['Compliant',           distribution.compliant,     items.length ? `${((distribution.compliant     / items.length) * 100).toFixed(1)}%` : '0%'],
      ['Partially Compliant', distribution.partial,       items.length ? `${((distribution.partial       / items.length) * 100).toFixed(1)}%` : '0%'],
      ['Non-Compliant',       distribution.non_compliant, items.length ? `${((distribution.non_compliant / items.length) * 100).toFixed(1)}%` : '0%'],
      ['Not Assessed',        distribution.not_assessed,  items.length ? `${((distribution.not_assessed  / items.length) * 100).toFixed(1)}%` : '0%'],
    ]), 'Summary');

    // Sheet 2 — All Controls
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Function', 'Category', 'Control ID', 'Control Name', 'Status', 'Notes'],
      ...items.map(item => [
        item.function?.name   || '',
        item.category?.name   || '',
        item.subcategory?.id  || '',
        item.subcategory?.name || '',
        statusLabel(item.status || 'not_assessed'),
        item.notes || '',
      ]),
    ]), 'All Controls');

    // Sheet 3 — Findings only
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Control ID', 'Control Name', 'Function', 'Category', 'Status', 'Notes'],
      ...findings.map(item => [
        item.subcategory?.id  || '',
        item.subcategory?.name || '',
        item.function?.name   || '',
        item.category?.name   || '',
        statusLabel(item.status || ''),
        item.notes || '',
      ]),
    ]), 'Findings');

    const safeName = (assessment?.name || 'report').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    XLSX.writeFile(wb, `assessment-report-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [items, findings, distribution, overallScore, assessment]);

  // ── toggle helpers ─────────────────────────────────────────────────────────
  const toggleFunction = (fId: string) => {
    setExpandedFunctions(prev => {
      const next = new Set(prev);
      if (next.has(fId)) next.delete(fId); else next.add(fId);
      return next;
    });
  };

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        {[180, 110, 300, 280].map((h, i) => (
          <div key={i} style={{ height: h, background: T.borderLight, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 0', textAlign: 'center' }}>
        <div style={{ ...card, padding: 16, background: T.dangerLight, borderColor: T.dangerBorder, marginBottom: 16 }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
        </div>
        <button onClick={loadData} style={{ padding: '9px 20px', borderRadius: 8, background: T.accent, border: 'none', fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const sc = scoreColorOf(overallScore);
  const circumference = 2 * Math.PI * 52;

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Print stylesheet ─────────────────────────────────────────────── */}
      <style>{`
        @media print {
          nav, aside, .sidebar, .no-print, [data-no-print] { display: none !important; }
          html, body { background: #fff !important; color: #111 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { box-shadow: none !important; }
          .rpt-card {
            background: #fff !important;
            border: 1px solid #d1d5db !important;
            break-inside: avoid;
          }
          .rpt-card * { color: #374151 !important; }
          .rpt-card h1, .rpt-card h2, .rpt-card h3 { color: #111827 !important; }
          .rpt-page-break { break-before: page; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 56 }}>

        {/* ── Toolbar (hidden on print) ───────────────────────────────────── */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          <Link
            to={`/assessments/${id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textSecondary}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
          >
            <ChevronLeft size={14} /> Back to Assessment
          </Link>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportExcel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textSecondary, cursor: 'pointer', transition: 'all 0.14s' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = T.accentBorder; el.style.color = T.textPrimary; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = T.border; el.style.color = T.textSecondary; }}
            >
              <FileDown size={13} /> Export Excel
            </button>
            <button
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: T.accent, border: 'none', fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'opacity 0.14s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
            >
              <Download size={13} /> Export PDF
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — Header
        ═══════════════════════════════════════════════════════════════════ */}
        {assessment && (
          <div className="rpt-card" style={{ ...card, padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>

              {/* Left — name · badges · meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontFamily: T.fontSans, fontSize: 26, fontWeight: 700, color: T.textPrimary, margin: '0 0 12px', lineHeight: 1.2 }}>
                  {assessment.name}
                </h1>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: T.accentLight, color: T.accent, border: `1px solid ${T.accentBorder}` }}>
                    {assessment.assessment_type === 'organization' ? 'Organization Assessment' : 'Vendor Assessment'}
                  </span>
                  <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', ...(assessment.status === 'completed' ? { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` } : { background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` }) }}>
                    {assessment.status}
                  </span>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  {assessment.vendor && (
                    <div>
                      <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Vendor</div>
                      <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{assessment.vendor.name}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Created</div>
                    <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>{fmtDate(assessment.created_at)}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Last Updated</div>
                    <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>{fmtDate(assessment.updated_at)}</div>
                  </div>
                  {assessment.completed_at && (
                    <div>
                      <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Completed</div>
                      <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>{fmtDate(assessment.completed_at)}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Framework</div>
                    <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.accent }}>NIST CSF 2.0</div>
                  </div>
                </div>
              </div>

              {/* Right — donut score */}
              <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
                <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke={T.borderLight} strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={sc} strokeWidth="12"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${circumference * (1 - overallScore / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: T.fontMono, fontSize: 22, fontWeight: 700, color: T.textPrimary, lineHeight: 1 }}>
                    {Math.round(overallScore)}%
                  </span>
                  <span style={{ fontFamily: T.fontSans, fontSize: 9, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>
                    Compliance
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — Executive Summary (4 stat cards)
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Controls',       count: items.length,               pct: 100,                                                               color: T.accent,  bg: T.accentLight,  border: T.accentBorder  },
            { label: 'Compliant',            count: distribution.compliant,     pct: items.length ? (distribution.compliant     / items.length) * 100 : 0, color: T.success, bg: T.successLight, border: T.successBorder },
            { label: 'Partially Compliant',  count: distribution.partial,       pct: items.length ? (distribution.partial       / items.length) * 100 : 0, color: T.warning, bg: T.warningLight, border: T.warningBorder },
            { label: 'Non-Compliant',        count: distribution.non_compliant, pct: items.length ? (distribution.non_compliant / items.length) * 100 : 0, color: T.danger,  bg: T.dangerLight,  border: T.dangerBorder  },
          ].map(stat => (
            <div key={stat.label} className="rpt-card" style={{ ...card, padding: '20px 22px' }}>
              <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: T.fontMono, fontSize: 34, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                {stat.count}
              </div>
              <div style={{ marginTop: 10, display: 'inline-flex', padding: '3px 8px', borderRadius: 6, background: stat.bg, border: `1px solid ${stat.border}`, fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: stat.color }}>
                {stat.pct.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — CSF Function Breakdown
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rpt-card" style={{ ...card, overflow: 'hidden' }}>
          <CardHeader label="CSF Function Breakdown" right={
            <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted }}>
              Click a function to expand controls
            </span>
          } />

          {functionBreakdown.map((fn, idx) => {
            const pct = fn.total > 0 ? Math.round((fn.compliant / fn.total) * 100) : 0;
            const fc = scoreColorOf(pct);
            const isExpanded = expandedFunctions.has(fn.id);
            const isLast = idx === functionBreakdown.length - 1;

            return (
              <div key={fn.id} style={{ borderBottom: isLast ? 'none' : `1px solid ${T.border}` }}>
                {/* Function summary row */}
                <div
                  style={{ padding: '16px 24px', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => toggleFunction(fn.id)}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  {/* Top line: badge · name · % · chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: T.accentLight, color: T.accent, border: `1px solid ${T.accentBorder}`, flexShrink: 0 }}>
                      {fn.id}
                    </span>
                    <span style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.textPrimary, flex: 1 }}>
                      {fn.name}
                    </span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 15, fontWeight: 700, color: fc, flexShrink: 0 }}>
                      {pct}%
                    </span>
                    <span style={{ color: T.textMuted, flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: T.borderLight }}>
                    {fn.total > 0 && (
                      <>
                        <div style={{ width: `${(fn.compliant    / fn.total) * 100}%`, background: T.success, transition: 'width 0.5s' }} />
                        <div style={{ width: `${(fn.partial       / fn.total) * 100}%`, background: T.warning, transition: 'width 0.5s' }} />
                        <div style={{ width: `${(fn.non_compliant / fn.total) * 100}%`, background: T.danger,  transition: 'width 0.5s' }} />
                      </>
                    )}
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Compliant',    count: fn.compliant,     color: T.success   },
                      { label: 'Partial',       count: fn.partial,       color: T.warning   },
                      { label: 'Non-Compliant', count: fn.non_compliant, color: T.danger    },
                      { label: 'Not Assessed',  count: fn.not_assessed,  color: T.textMuted },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary }}>
                          {l.label}: <span style={{ fontWeight: 600 }}>{l.count}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded: categories + subcategory items */}
                {isExpanded && (
                  <div style={{ background: T.bg, borderTop: `1px solid ${T.borderLight}`, padding: '8px 24px 20px' }}>
                    {Object.values(fn.categories)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(cat => (
                        <div key={cat.id} style={{ marginTop: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.accent, background: T.accentLight, border: `1px solid ${T.accentBorder}`, padding: '1px 6px', borderRadius: 4 }}>
                              {cat.id}
                            </span>
                            <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
                              {cat.name}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {cat.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 8, background: T.card, border: `1px solid ${T.border}` }}>
                                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.accent, flexShrink: 0, width: 76 }}>
                                  {item.subcategory?.id}
                                </span>
                                <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, flex: 1, lineHeight: 1.5 }}>
                                  {item.subcategory?.name || item.subcategory?.description?.substring(0, 90)}
                                </span>
                                <span style={{ ...statusBadge(item.status || 'not_assessed'), flexShrink: 0 }}>
                                  {statusLabel(item.status || 'not_assessed')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — Findings Table
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rpt-card rpt-page-break" style={{ ...card, overflow: 'hidden' }}>
          <CardHeader
            label={`Findings — ${findings.length} item${findings.length !== 1 ? 's' : ''} requiring attention`}
            right={
              <span style={{ fontFamily: T.fontMono, fontSize: 11, padding: '3px 8px', borderRadius: 6, background: findings.length > 0 ? T.dangerLight : T.successLight, color: findings.length > 0 ? T.danger : T.success, border: `1px solid ${findings.length > 0 ? T.dangerBorder : T.successBorder}` }}>
                {distribution.non_compliant} non-compliant · {distribution.partial} partial
              </span>
            }
          />

          {findings.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
              All controls are compliant — no findings to display.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {([
                      { col: 'id'     as const, label: 'Control ID', w: 110 },
                      { col: 'name'   as const, label: 'Control Name', w: undefined },
                      { col: 'status' as const, label: 'Status', w: 148 },
                    ]).map(h => (
                      <th
                        key={h.col}
                        onClick={() => toggleSort(h.col)}
                        style={{ padding: '10px 20px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: h.w, whiteSpace: 'nowrap', fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {h.label}
                          {sortCol === h.col
                            ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                            : <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />
                          }
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: idx < findings.length - 1 ? `1px solid ${T.borderLight}` : 'none', transition: 'background 0.08s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = T.bg}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px', verticalAlign: 'top' }}>
                        <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.accent }}>
                          {item.subcategory?.id}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'top' }}>
                        <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, lineHeight: 1.5 }}>
                          {item.subcategory?.name || item.subcategory?.description?.substring(0, 90)}
                        </div>
                        <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {item.function?.name} · {item.category?.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'top' }}>
                        <span style={statusBadge(item.status || 'not_assessed')}>
                          {statusLabel(item.status || 'not_assessed')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', verticalAlign: 'top' }}>
                        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                          {item.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
