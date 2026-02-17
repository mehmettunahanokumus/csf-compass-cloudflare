import { useState } from 'react';
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
} from 'lucide-react';

// ── Export card types ─────────────────────────────
interface ExportType {
  icon: React.ElementType;
  title: string;
  description: string;
  formats: string[];
  iconColor: string;
  iconBg: string;
  status?: 'available' | 'coming_soon';
}

const exportTypes: ExportType[] = [
  {
    icon: FileText,
    title: 'Assessment Report',
    description: 'Comprehensive PDF with executive summary, compliance breakdown, gap analysis and remediation roadmap',
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.1)',
    formats: ['PDF'],
    status: 'available',
  },
  {
    icon: FileSpreadsheet,
    title: 'Assessment Data',
    description: 'Raw assessment data workbook with scores by category, evidence tracking and item-level detail',
    iconColor: '#16A34A',
    iconBg: 'rgba(22,163,74,0.1)',
    formats: ['Excel', 'CSV'],
    status: 'available',
  },
  {
    icon: GitCompare,
    title: 'Comparison Report',
    description: 'Side-by-side org vs vendor assessment with gap highlights, delta scores and variance analysis',
    iconColor: '#4F46E5',
    iconBg: 'rgba(79,70,229,0.1)',
    formats: ['PDF', 'Excel'],
    status: 'available',
  },
  {
    icon: Award,
    title: 'Vendor Scorecard',
    description: 'Professional risk scorecard with compliance ratings, risk tier, assessment history and trends',
    iconColor: '#9333EA',
    iconBg: 'rgba(147,51,234,0.1)',
    formats: ['PDF'],
    status: 'coming_soon',
  },
  {
    icon: BarChart,
    title: 'Executive Dashboard',
    description: 'Board-ready compliance dashboard with KPIs, maturity levels and strategic recommendations',
    iconColor: '#D97706',
    iconBg: 'rgba(217,119,6,0.1)',
    formats: ['PDF', 'PPTX'],
    status: 'coming_soon',
  },
  {
    icon: Package,
    title: 'Audit Evidence Package',
    description: 'Complete audit-ready package with all items, evidence files and compliance documentation',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14,165,233,0.1)',
    formats: ['ZIP'],
    status: 'coming_soon',
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

export default function Exports() {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleExport = (idx: number) => {
    setLoadingId(idx);
    setTimeout(() => setLoadingId(null), 2000);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Exports
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
          3 exports ready
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

      {/* ── Export types ──────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: '#4F46E5', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
            Export Types
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {exportTypes.map((type, idx) => {
            const Icon = type.icon;
            const isComingSoon = type.status === 'coming_soon';
            const isLoading = loadingId === idx;
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
                  opacity: isComingSoon ? 0.65 : 1,
                }}
                onMouseEnter={e => {
                  if (!isComingSoon) {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = '0 6px 20px rgba(15,23,42,0.1)';
                    el.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                {/* Icon + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: type.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: type.iconColor,
                  }}>
                    <Icon size={18} />
                  </div>
                  {isComingSoon && (
                    <span style={{
                      display: 'inline-flex',
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: '#F1F5F9',
                      color: '#94A3B8',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}>
                      SOON
                    </span>
                  )}
                </div>

                {/* Title */}
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6, lineHeight: 1.3 }}>
                  {type.title}
                </div>

                {/* Description */}
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B', lineHeight: 1.5, flex: 1, marginBottom: 14 }}>
                  {type.description}
                </div>

                {/* Formats */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                  {type.formats.map(f => formatBadge(f))}
                </div>

                {/* Action button */}
                <button
                  onClick={() => !isComingSoon && handleExport(idx)}
                  disabled={isComingSoon || isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: isComingSoon ? '#F1F5F9' : isLoading ? '#E0E7FF' : '#4F46E5',
                    color: isComingSoon ? '#94A3B8' : isLoading ? '#4F46E5' : '#fff',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: isComingSoon ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    marginTop: 'auto',
                  }}
                >
                  {isLoading
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                    : isComingSoon
                    ? 'Coming Soon'
                    : <><Download size={13} /> Generate & Download</>
                  }
                </button>
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
