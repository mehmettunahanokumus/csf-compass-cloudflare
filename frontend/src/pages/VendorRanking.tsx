import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, ArrowUpDown, ArrowUp, ArrowDown, Building2 } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage } from '../api/client';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  card:         '#FFFFFF',
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textMuted:    '#94A3B8',
  textFaint:    '#CBD5E1',
  accent:       '#4F46E5',
  accentLight:  'rgba(79,70,229,0.08)',
  accentBorder: 'rgba(79,70,229,0.2)',
  success:      '#16A34A',
  successLight: 'rgba(22,163,74,0.08)',
  warning:      '#D97706',
  warningLight: 'rgba(217,119,6,0.08)',
  danger:       '#DC2626',
  dangerLight:  'rgba(220,38,38,0.08)',
  fontSans:     'Manrope, sans-serif',
  fontMono:     'JetBrains Mono, monospace',
  fontDisplay:  'Barlow Condensed, sans-serif',
};

const card: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`,
  borderRadius: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
};

// ── Helpers ───────────────────────────────────────────────────
type SortField = 'name' | 'industry' | 'score' | 'criticality' | 'status';
type SortDirection = 'asc' | 'desc';
type CriticalityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const criticalityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const statusOrder: Record<string, number> = { active: 0, under_review: 1, inactive: 2, terminated: 3 };

function criticalityConfig(level: string | undefined) {
  switch (level) {
    case 'critical': return { bg: T.dangerLight,  color: T.danger,   border: 'rgba(220,38,38,0.2)',  label: 'Critical' };
    case 'high':     return { bg: T.warningLight, color: T.warning,  border: 'rgba(217,119,6,0.2)',  label: 'High'     };
    case 'medium':   return { bg: T.accentLight,  color: T.accent,   border: T.accentBorder,          label: 'Medium'   };
    case 'low':      return { bg: T.successLight, color: T.success,  border: 'rgba(22,163,74,0.2)',  label: 'Low'      };
    default:         return { bg: 'rgba(148,163,184,0.08)', color: T.textSecondary, border: T.border, label: 'N/A' };
  }
}

function statusConfig(status: string | undefined) {
  switch (status) {
    case 'active':       return { bg: T.successLight, color: T.success,       border: 'rgba(22,163,74,0.2)',  label: 'Active'       };
    case 'under_review': return { bg: T.warningLight, color: T.warning,       border: 'rgba(217,119,6,0.2)',  label: 'Under Review' };
    case 'inactive':     return { bg: 'rgba(148,163,184,0.08)', color: T.textSecondary, border: T.border,    label: 'Inactive'     };
    case 'terminated':   return { bg: T.dangerLight,  color: T.danger,        border: 'rgba(220,38,38,0.2)',  label: 'Terminated'   };
    default:             return { bg: 'rgba(148,163,184,0.08)', color: T.textSecondary, border: T.border,    label: 'Unknown'      };
  }
}

function scoreColor(s: number) {
  if (s >= 70) return T.success;
  if (s >= 50) return T.warning;
  return T.danger;
}

export default function VendorRanking() {
  const [vendors,       setVendors]       = useState<Vendor[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [sortField,     setSortField]     = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeFilter,  setActiveFilter]  = useState<CriticalityFilter>('all');
  const [hoveredRow,    setHoveredRow]    = useState<string | null>(null);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsApi.list();
      setVendors(data);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const filteredVendors = useMemo(() => {
    let result = [...vendors];
    if (activeFilter !== 'all') {
      result = result.filter(v => (v.criticality_level || v.risk_tier || 'medium') === activeFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':       cmp = a.name.localeCompare(b.name); break;
        case 'industry':   cmp = (a.industry || '').localeCompare(b.industry || ''); break;
        case 'score':      cmp = (a.latest_assessment_score ?? -1) - (b.latest_assessment_score ?? -1); break;
        case 'criticality': {
          const aL = a.criticality_level || a.risk_tier || 'medium';
          const bL = b.criticality_level || b.risk_tier || 'medium';
          cmp = (criticalityOrder[aL] ?? 99) - (criticalityOrder[bL] ?? 99); break;
        }
        case 'status': {
          cmp = (statusOrder[a.vendor_status || 'active'] ?? 99) - (statusOrder[b.vendor_status || 'active'] ?? 99); break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [vendors, activeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection(field === 'score' ? 'desc' : 'asc'); }
  };

  const exportCsv = () => {
    const header = 'Rank,Name,Industry,Score,Criticality,Status';
    const rows = filteredVendors.map((v, i) => {
      const score = v.latest_assessment_score != null ? v.latest_assessment_score.toFixed(1) : 'N/A';
      const crit  = criticalityConfig(v.criticality_level || v.risk_tier).label;
      const stat  = statusConfig(v.vendor_status).label;
      const name  = v.name.includes(',') ? `"${v.name}"` : v.name;
      const ind   = (v.industry || 'N/A').includes(',') ? `"${v.industry}"` : v.industry || 'N/A';
      return `${i + 1},${name},${ind},${score},${crit},${stat}`;
    });
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'vendor-rankings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ color: T.textFaint }} />;
    return sortDirection === 'asc'
      ? <ArrowUp size={12} style={{ color: T.accent }} />
      : <ArrowDown size={12} style={{ color: T.accent }} />;
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 20px',
    fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted,
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    borderBottom: `1px solid ${T.borderLight}`,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: T.border, opacity: 0.5 }} />
            <div style={{ height: 26, width: 180, borderRadius: 8, background: T.border, opacity: 0.5 }} />
          </div>
          <div style={{ height: 38, width: 120, borderRadius: 8, background: T.border, opacity: 0.4 }} />
        </div>
        <div style={{ ...card, overflow: 'hidden' }} className="animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}` }}>
              <div style={{ width: 30, height: 13, borderRadius: 4, background: T.borderLight }} />
              <div style={{ flex: 1, height: 13, borderRadius: 4, background: T.borderLight }} />
              <div style={{ width: 80, height: 13, borderRadius: 4, background: T.borderLight }} />
              <div style={{ width: 60, height: 20, borderRadius: 100, background: T.borderLight }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...card, padding: '16px 20px', background: T.dangerLight, borderColor: 'rgba(220,38,38,0.2)' }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/vendors" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: T.card, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textMuted, cursor: 'pointer',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#CBD5E1'; el.style.color = T.textPrimary; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = T.border; el.style.color = T.textMuted; }}
            >
              <ArrowLeft size={16} />
            </div>
          </Link>
          <div>
            <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
              Vendor Rankings
            </h1>
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 2 }}>
              Comparative security posture overview
            </p>
          </div>
        </div>
        <button onClick={exportCsv} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 9,
          background: T.accent, color: '#fff',
          fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4338CA'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.accent; }}
        >
          <FileDown size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'critical', 'high', 'medium', 'low'] as CriticalityFilter[]).map(opt => (
            <button key={opt} onClick={() => setActiveFilter(opt)} style={{
              padding: '5px 13px', borderRadius: 7,
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.13s',
              background: activeFilter === opt ? T.accent : T.card,
              color:      activeFilter === opt ? '#fff' : T.textSecondary,
              outline:    activeFilter === opt ? 'none' : `1px solid ${T.border}`,
              boxShadow:  activeFilter === opt ? '0 1px 3px rgba(79,70,229,0.25)' : 'none',
            }}>
              {opt === 'all' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
          Showing <strong style={{ color: T.textPrimary }}>{filteredVendors.length}</strong> vendor{filteredVendors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {filteredVendors.length === 0 ? (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={22} style={{ color: T.textFaint }} />
          </div>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: 0 }}>No vendors found</p>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, margin: 0 }}>
            {activeFilter !== 'all' ? 'No vendors match the selected filter' : 'No vendors found'}
          </p>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ ...thStyle, cursor: 'default', width: 52 }}>#</th>
                {([
                  { field: 'name' as SortField,        label: 'Vendor Name' },
                  { field: 'industry' as SortField,    label: 'Industry'    },
                  { field: 'score' as SortField,       label: 'Score'       },
                  { field: 'criticality' as SortField, label: 'Criticality' },
                  { field: 'status' as SortField,      label: 'Status'      },
                ]).map(col => (
                  <th key={col.field} style={thStyle} onClick={() => handleSort(col.field)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {col.label} <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor, index) => {
                const crit  = criticalityConfig(vendor.criticality_level || vendor.risk_tier);
                const stat  = statusConfig(vendor.vendor_status);
                const score = vendor.latest_assessment_score;
                const isHov = hoveredRow === vendor.id;
                return (
                  <tr
                    key={vendor.id}
                    style={{
                      borderBottom: `1px solid ${T.borderLight}`,
                      background: isHov ? '#F8FAFC' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={() => setHoveredRow(vendor.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.textFaint }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Link to={`/vendors/${vendor.id}`} style={{
                        fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                        color: isHov ? T.accent : T.textPrimary,
                        textDecoration: 'none', transition: 'color 0.13s',
                      }}>
                        {vendor.name}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>
                      {vendor.industry || '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {score != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 72, height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                            <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: scoreColor(score), transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: scoreColor(score), lineHeight: 1 }}>
                            {score.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textFaint }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '3px 10px', borderRadius: 100,
                        fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                        background: crit.bg, color: crit.color, border: `1px solid ${crit.border}`,
                      }}>
                        {crit.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '3px 10px', borderRadius: 100,
                        fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                        background: stat.bg, color: stat.color, border: `1px solid ${stat.border}`,
                      }}>
                        {stat.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
