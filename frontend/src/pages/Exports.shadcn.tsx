import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  GitCompare,
  Award,
  BarChart,
  Package,
  Download,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  FileDown,
  AlertCircle,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import { evidenceApi } from '../api/evidence';
import type { Assessment, Vendor } from '../types';

// ── CSV helper ──────────────────────────────────
function downloadCSV(data: string[][], filename: string) {
  const csv = data
    .map(row =>
      row
        .map(cell => {
          const escaped = String(cell ?? '').replace(/"/g, '""');
          return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export card types ─────────────────────────────
type ExportKey = 'assessment_report' | 'assessment_data' | 'comparison' | 'vendor_scorecard' | 'executive_dashboard' | 'audit_evidence';

interface ExportType {
  key: ExportKey;
  icon: React.ElementType;
  title: string;
  description: string;
  formats: string[];
  iconColor: string;
  iconBg: string;
}

const exportTypes: ExportType[] = [
  {
    key: 'assessment_report',
    icon: FileText,
    title: 'Assessment Report',
    description: 'Comprehensive PDF with executive summary, compliance breakdown, gap analysis and remediation roadmap',
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.1)',
    formats: ['PDF'],
  },
  {
    key: 'assessment_data',
    icon: FileSpreadsheet,
    title: 'Assessment Data',
    description: 'Raw assessment data workbook with scores by category, evidence tracking and item-level detail',
    iconColor: '#16A34A',
    iconBg: 'rgba(22,163,74,0.1)',
    formats: ['CSV'],
  },
  {
    key: 'comparison',
    icon: GitCompare,
    title: 'Comparison Report',
    description: 'Side-by-side assessment comparison with gap highlights, delta scores and variance analysis',
    iconColor: '#4F46E5',
    iconBg: 'rgba(79,70,229,0.1)',
    formats: ['PDF'],
  },
  {
    key: 'vendor_scorecard',
    icon: Award,
    title: 'Vendor Scorecard',
    description: 'Professional risk scorecard with compliance ratings, risk tier, assessment history and trends',
    iconColor: '#9333EA',
    iconBg: 'rgba(147,51,234,0.1)',
    formats: ['CSV'],
  },
  {
    key: 'executive_dashboard',
    icon: BarChart,
    title: 'Executive Dashboard',
    description: 'Board-ready compliance dashboard with KPIs, maturity levels and strategic recommendations',
    iconColor: '#D97706',
    iconBg: 'rgba(217,119,6,0.1)',
    formats: ['CSV'],
  },
  {
    key: 'audit_evidence',
    icon: Package,
    title: 'Audit Evidence Package',
    description: 'Complete audit-ready package with all items, evidence files and compliance documentation',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14,165,233,0.1)',
    formats: ['CSV'],
  },
];

// ── Recent exports (static demo) ──────────────────
const recentExports = [
  { name: 'Q4 Internal Assessment — Full Report', type: 'PDF', size: '2.4 MB', date: 'Today, 09:41',   status: 'ready'   },
  { name: 'CloudHost Pro — Vendor Scorecard',     type: 'PDF', size: '890 KB', date: 'Yesterday',      status: 'ready'   },
  { name: 'Assessment Data Export — Feb 2026',    type: 'CSV', size: '145 KB', date: 'Feb 14',         status: 'ready'   },
  { name: 'Executive Dashboard — Q1 2026',        type: 'PDF', size: '—',      date: 'Processing...',  status: 'pending' },
];

function formatBadge(fmt: string) {
  const colors: Record<string, string> = {
    PDF:   '#EF4444',
    Excel: '#16A34A',
    CSV:   '#0EA5E9',
    ZIP:   '#D97706',
    PPTX:  '#9333EA',
  };
  const c = colors[fmt] ?? '#94A3B8';
  return (
    <span
      key={fmt}
      style={{
        display: 'inline-flex',
        padding: '2px 7px',
        borderRadius: 4,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 500,
        background: `${c}10`,
        color: c,
        border: `1px solid ${c}25`,
      }}
    >
      {fmt}
    </span>
  );
}

// ── Selector dropdown ──────────────────────────────
function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          background: '#F8FAFC',
          fontFamily: 'Manrope, sans-serif',
          fontSize: 12,
          color: '#0F172A',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">Select...</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function Exports() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Per-card state
  const [loadingCard, setLoadingCard] = useState<ExportKey | null>(null);
  const [errorCard, setErrorCard] = useState<{ key: ExportKey; msg: string } | null>(null);

  // Selections
  const [sel, setSel] = useState<Record<string, string>>({
    assessment_report: '',
    assessment_data: '',
    comparison_1: '',
    comparison_2: '',
    vendor_scorecard: '',
    audit_evidence: '',
  });

  // Load assessments and vendors on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aList, vList] = await Promise.all([
          assessmentsApi.list(),
          vendorsApi.list(),
        ]);
        if (!cancelled) {
          setAssessments(aList);
          setVendors(vList);
        }
      } catch {
        // silent — selectors will just be empty
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const assessmentOptions = assessments.map(a => ({
    value: a.id,
    label: `${a.name}${a.overall_score != null ? ` (${a.overall_score.toFixed(1)}%)` : ''}`,
  }));

  const vendorOptions = vendors.map(v => ({
    value: v.id,
    label: v.name,
  }));

  const updateSel = (field: string, value: string) => setSel(prev => ({ ...prev, [field]: value }));

  // ── Generate handlers ──────────────────────────
  const handleGenerate = async (key: ExportKey) => {
    setErrorCard(null);
    setLoadingCard(key);
    try {
      switch (key) {
        case 'assessment_report': {
          const id = sel.assessment_report;
          if (!id) { setErrorCard({ key, msg: 'Select an assessment' }); break; }
          navigate(`/assessments/${id}/report`);
          break;
        }
        case 'assessment_data': {
          const id = sel.assessment_data;
          if (!id) { setErrorCard({ key, msg: 'Select an assessment' }); break; }
          const items = await assessmentsApi.getItems(id);
          const assessment = assessments.find(a => a.id === id);
          const rows: string[][] = [
            ['Subcategory ID', 'Subcategory', 'Category', 'Function', 'Status', 'Notes'],
            ...items.map(item => [
              item.subcategory_id,
              item.subcategory?.name ?? '',
              item.category?.name ?? '',
              item.function?.name ?? '',
              item.status,
              item.notes ?? '',
            ]),
          ];
          const name = (assessment?.name ?? 'assessment').replace(/[^a-zA-Z0-9]/g, '-');
          const date = new Date().toISOString().slice(0, 10);
          downloadCSV(rows, `assessment-data-${name}-${date}.csv`);
          break;
        }
        case 'comparison': {
          const id1 = sel.comparison_1;
          const id2 = sel.comparison_2;
          if (!id1 || !id2) { setErrorCard({ key, msg: 'Select two assessments' }); break; }
          if (id1 === id2) { setErrorCard({ key, msg: 'Select two different assessments' }); break; }
          navigate(`/assessments/${id1}/comparison?with=${id2}`);
          break;
        }
        case 'vendor_scorecard': {
          const vid = sel.vendor_scorecard;
          if (!vid) { setErrorCard({ key, msg: 'Select a vendor' }); break; }
          const stats = await vendorsApi.getStats(vid);
          const v = stats.vendor;
          const rows: string[][] = [
            ['Field', 'Value'],
            ['Vendor Name', v.name],
            ['Industry', v.industry ?? 'N/A'],
            ['Criticality', v.criticality_level ?? 'N/A'],
            ['Status', v.vendor_status ?? 'N/A'],
            ['Risk Score', v.risk_score != null ? String(v.risk_score) : 'N/A'],
            ['Total Assessments', String(stats.totalAssessments)],
            ['Completed Assessments', String(stats.completedAssessments)],
            ['Average Score', stats.averageScore != null ? `${stats.averageScore.toFixed(1)}%` : 'N/A'],
            ['Latest Assessment', stats.latestAssessment?.name ?? 'N/A'],
            ['Latest Score', stats.latestAssessment?.overall_score != null ? `${stats.latestAssessment.overall_score.toFixed(1)}%` : 'N/A'],
          ];
          const name = v.name.replace(/[^a-zA-Z0-9]/g, '-');
          downloadCSV(rows, `vendor-scorecard-${name}.csv`);
          break;
        }
        case 'executive_dashboard': {
          const allVendors = vendors;
          if (allVendors.length === 0) { setErrorCard({ key, msg: 'No vendors found' }); break; }
          const rows: string[][] = [
            ['Vendor', 'Industry', 'Criticality', 'Status', 'Risk Score', 'Latest Assessment Score'],
            ...allVendors.map(v => [
              v.name,
              v.industry ?? 'N/A',
              v.criticality_level ?? 'N/A',
              v.vendor_status ?? 'N/A',
              v.risk_score != null ? String(v.risk_score) : 'N/A',
              v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
            ]),
          ];
          downloadCSV(rows, `executive-dashboard-${new Date().toISOString().slice(0, 10)}.csv`);
          break;
        }
        case 'audit_evidence': {
          const id = sel.audit_evidence;
          if (!id) { setErrorCard({ key, msg: 'Select an assessment' }); break; }
          const files = await evidenceApi.getForAssessment(id);
          const assessment = assessments.find(a => a.id === id);
          if (files.length === 0) { setErrorCard({ key, msg: 'No evidence files found for this assessment' }); break; }
          const rows: string[][] = [
            ['File Name', 'File Type', 'File Size (bytes)', 'Assessment Item ID', 'Uploaded At'],
            ...files.map(f => [
              f.file_name,
              f.file_type ?? 'N/A',
              String(f.file_size),
              f.assessment_item_id ?? 'N/A',
              f.uploaded_at ? new Date(f.uploaded_at).toISOString() : 'N/A',
            ]),
          ];
          const name = (assessment?.name ?? 'assessment').replace(/[^a-zA-Z0-9]/g, '-');
          downloadCSV(rows, `audit-evidence-${name}.csv`);
          break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setErrorCard({ key, msg });
    } finally {
      setLoadingCard(null);
    }
  };

  // ── Render selector area per card ──────────────
  const renderCardForm = (type: ExportType) => {
    const isLoading = loadingCard === type.key;
    const error = errorCard?.key === type.key ? errorCard.msg : null;

    const formContent = (() => {
      switch (type.key) {
        case 'assessment_report':
        case 'assessment_data':
        case 'audit_evidence':
          return (
            <Selector
              label="Assessment"
              value={sel[type.key === 'assessment_report' ? 'assessment_report' : type.key === 'assessment_data' ? 'assessment_data' : 'audit_evidence']}
              onChange={v => updateSel(type.key === 'assessment_report' ? 'assessment_report' : type.key === 'assessment_data' ? 'assessment_data' : 'audit_evidence', v)}
              options={assessmentOptions}
            />
          );
        case 'comparison':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <Selector label="Assessment 1" value={sel.comparison_1} onChange={v => updateSel('comparison_1', v)} options={assessmentOptions} />
              <Selector label="Assessment 2" value={sel.comparison_2} onChange={v => updateSel('comparison_2', v)} options={assessmentOptions} />
            </div>
          );
        case 'vendor_scorecard':
          return (
            <Selector label="Vendor" value={sel.vendor_scorecard} onChange={v => updateSel('vendor_scorecard', v)} options={vendorOptions} />
          );
        case 'executive_dashboard':
          return (
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', padding: '4px 0' }}>
              Exports all {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} summary
            </div>
          );
        default:
          return null;
      }
    })();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {formContent}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#EF4444' }}>
            <AlertCircle size={12} />
            {error}
          </div>
        )}
        <button
          onClick={() => handleGenerate(type.key)}
          disabled={isLoading || loadingData}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            background: isLoading ? '#E0E7FF' : '#4F46E5',
            color: isLoading ? '#4F46E5' : '#fff',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            border: 'none',
            cursor: isLoading || loadingData ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            marginTop: 'auto',
            opacity: loadingData ? 0.6 : 1,
          }}
        >
          {isLoading
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
            : <><Download size={13} /> Generate</>
          }
        </button>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Reporting Center
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
            Generate reports, scorecards and audit packages
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          background: 'rgba(22,163,74,0.08)',
          border: '1px solid rgba(22,163,74,0.2)',
          fontFamily: 'Manrope, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: '#16A34A',
        }}>
          <CheckCircle2 size={13} />
          {exportTypes.length} reports available
        </div>
      </div>

      {/* ── Quick stats ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: <FileDown size={16} />,    label: 'Total Exports',   value: '24',  color: '#4F46E5' },
          { icon: <CheckCircle2 size={16} />, label: 'Ready to Download', value: '3', color: '#16A34A' },
          { icon: <Clock size={16} />,        label: 'Processing',      value: '1',   color: '#D97706' },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `${s.color}10`, border: `1px solid ${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Available Reports ──────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: '#4F46E5', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
            Available Reports
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {exportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.title}
                style={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '18px 20px',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.18s, transform 0.18s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '0 6px 20px rgba(15,23,42,0.1)';
                  el.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                {/* Icon */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: type.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: type.iconColor,
                  }}>
                    <Icon size={18} />
                  </div>
                </div>

                {/* Title */}
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6, lineHeight: 1.3 }}>
                  {type.title}
                </div>

                {/* Description */}
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 14 }}>
                  {type.description}
                </div>

                {/* Formats */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                  {type.formats.map(f => formatBadge(f))}
                </div>

                {/* Selector + Generate */}
                {renderCardForm(type)}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent exports ────────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: '#4F46E5' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
              Recent Exports
            </span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer' }}>
            View all <ChevronRight size={13} />
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['File Name', 'Format', 'Size', 'Date', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left',
                  padding: '9px 20px',
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  borderBottom: '1px solid #F1F5F9',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentExports.map((ex, idx) => (
              <tr
                key={idx}
                style={{ borderBottom: idx < recentExports.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
              >
                <td style={{ padding: '12px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={13} style={{ color: '#64748B' }} />
                    </div>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      {ex.name}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 20px' }}>
                  {formatBadge(ex.type)}
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#64748B' }}>
                  {ex.size}
                </td>
                <td style={{ padding: '12px 20px', fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8' }}>
                  {ex.date}
                </td>
                <td style={{ padding: '12px 20px' }}>
                  {ex.status === 'ready' ? (
                    <button style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 7,
                      background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.15)',
                      color: '#4F46E5',
                      fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.14s',
                    }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#4F46E5'; b.style.color = '#fff'; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(79,70,229,0.07)'; b.style.color = '#4F46E5'; }}
                    >
                      <Download size={11} /> Download
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D97706', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600 }}>
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      Processing
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Compliance note ───────────────────── */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid rgba(22,163,74,0.2)',
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
        </div>
        <div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 3 }}>
            Compliance-Ready Exports
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
            All exports include timestamps, digital signatures and complete audit trails — ready for SOC 2, ISO 27001, HIPAA and FedRAMP requirements.
          </div>
        </div>
      </div>

    </div>
  );
}

// Keyframe for spinner
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
