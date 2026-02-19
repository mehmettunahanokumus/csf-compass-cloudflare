import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Building2, Search, Trophy,
  AlertTriangle, TrendingUp, Shield,
  Eye, Pencil, Trash2, ChevronRight,
} from 'lucide-react';
import { vendorsApi } from '@/api/vendors';
import type { Vendor } from '@/types';
import { getErrorMessage, formatDate } from '@/api/client';
import NewVendorModal from '@/components/NewVendorModal';
import { T, card } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 70) return T.success;
  if (s >= 50) return T.warning;
  return T.danger;
}

function riskConfig(tier: string | undefined | null) {
  switch (tier) {
    case 'critical': return { bg: T.dangerLight,  color: T.danger,         border: 'rgba(220,38,38,0.2)',   label: 'Critical' };
    case 'high':     return { bg: T.warningLight, color: T.warning,        border: 'rgba(217,119,6,0.2)',   label: 'High'     };
    case 'medium':   return { bg: T.accentLight,  color: T.accent,         border: T.accentBorder,          label: 'Medium'   };
    case 'low':      return { bg: T.successLight, color: T.success,        border: 'rgba(22,163,74,0.2)',   label: 'Low'      };
    default:         return { bg: 'rgba(148,163,184,0.08)', color: T.textSecondary, border: T.border, label: 'Unknown' };
  }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const avatarColors = ['#4F46E5','#0EA5E9','#16A34A','#D97706','#DC2626','#9333EA','#0891B2','#059669'];
function avatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

// ── Skeleton row ──────────────────────────────────────────────
function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[280, 100, 80, 120, 90, 90].map((w, i) => (
        <td key={i} style={{ padding: '14px 20px' }}>
          <div style={{ width: w, height: 13, borderRadius: 5, background: '#F1F5F9' }} />
        </td>
      ))}
    </tr>
  );
}

// ── Filter pill ───────────────────────────────────────────────
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px', borderRadius: 7,
        fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
        border: 'none', cursor: 'pointer', transition: 'all 0.13s',
        background: active ? T.accent : T.card,
        color:      active ? '#fff' : T.textSecondary,
        outline:    active ? 'none' : `1px solid ${T.border}`,
        boxShadow:  active ? '0 1px 3px rgba(79,70,229,0.25)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ── Action button ─────────────────────────────────────────────
function actionBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 10px', borderRadius: 7,
    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
    color,
    background: `${color}08`,
    border: `1px solid ${color}20`,
    cursor: 'pointer', transition: 'background 0.13s, border-color 0.13s',
  };
}

// ── Main ──────────────────────────────────────────────────────
export default function Vendors() {
  const navigate = useNavigate();
  const [vendors,    setVendors]    = useState<Vendor[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showModal,  setShowModal]  = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsApi.list();
      setVendors(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      await vendorsApi.delete(vendor.id);
      setVendors(v => v.filter(x => x.id !== vendor.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filtered = vendors
    .filter(v =>
      (v.name.toLowerCase().includes(search.toLowerCase()) ||
       v.industry?.toLowerCase().includes(search.toLowerCase())) &&
      (riskFilter === 'all' || v.risk_tier === riskFilter)
    )
    .sort((a, b) => {
      const ord: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (ord[a.risk_tier ?? 'medium'] ?? 2) - (ord[b.risk_tier ?? 'medium'] ?? 2);
    });

  const highRisk = vendors.filter(v => (v.latest_assessment_score ?? 100) < 50);
  const critical = vendors.filter(v => v.risk_tier === 'critical' || v.criticality_level === 'critical');
  const avgScore = vendors.length > 0
    ? vendors.reduce((s, v) => s + (v.latest_assessment_score ?? 0), 0) / vendors.length
    : 0;

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Vendors
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 3 }}>
            Third-party security posture management
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, marginTop: 4, fontStyle: 'italic' }}>
            Group companies (subsidiaries) are managed under Group Companies.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/vendors/ranking')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: T.card, color: T.textSecondary,
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
              border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = '#CBD5E1'; b.style.color = T.textPrimary; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = T.border; b.style.color = T.textSecondary; }}
          >
            <Trophy size={14} /> Rankings
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9,
              background: T.accent, color: '#fff',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#4338CA'; b.style.boxShadow = '0 4px 12px rgba(79,70,229,0.35)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = T.accent;  b.style.boxShadow = '0 1px 3px rgba(79,70,229,0.3)'; }}
          >
            <Plus size={15} /> Add Vendor
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { icon: <Building2 size={16} />,     label: 'Total Vendors', value: loading ? '—' : `${vendors.length}`,                             color: T.accent         },
          { icon: <AlertTriangle size={16} />,  label: 'High Risk',     value: loading ? '—' : `${highRisk.length}`,                            color: T.danger         },
          { icon: <TrendingUp size={16} />,     label: 'Avg Score',     value: loading ? '—' : avgScore > 0 ? `${avgScore.toFixed(0)}%` : 'N/A', color: scoreColor(avgScore) },
          { icon: <Shield size={16} />,         label: 'Critical',      value: loading ? '—' : `${critical.length}`,                            color: T.warning        },
        ].map((k, i) => (
          <div key={i} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `${k.color}10`, border: `1px solid ${k.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color,
            }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>
                {k.value}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>
                {k.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(tier => (
            <FilterPill
              key={tier}
              label={tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              active={riskFilter === tier}
              onClick={() => setRiskFilter(tier)}
            />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 200, paddingLeft: 34, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              borderRadius: 8, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
              background: T.card, outline: 'none',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              {['Vendor', 'Industry', 'Risk Tier', 'Compliance Score', 'Last Assessment', ''].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 20px',
                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
              : filtered.map(vendor => {
                  const score  = vendor.latest_assessment_score;
                  const risk   = riskConfig(vendor.risk_tier ?? vendor.criticality_level);
                  const color  = avatarColor(vendor.name);
                  const isHov  = hoveredRow === vendor.id;
                  return (
                    <tr
                      key={vendor.id}
                      style={{
                        borderBottom: `1px solid ${T.borderLight}`,
                        background: isHov ? 'var(--surface-1)' : 'transparent',
                        transition: 'background 0.12s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredRow(vendor.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                    >
                      {/* Vendor name + avatar */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: `${color}15`, border: `1px solid ${color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 800, color }}>
                              {initials(vendor.name)}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: isHov ? T.accent : T.textPrimary, transition: 'color 0.13s' }}>
                              {vendor.name}
                            </div>
                            {vendor.contact_email && (
                              <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textFaint, marginTop: 2 }}>
                                {vendor.contact_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Industry */}
                      <td style={{ padding: '14px 20px', fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                        {vendor.industry ?? '—'}
                      </td>

                      {/* Risk tier badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '3px 10px', borderRadius: 100,
                          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                          background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
                          letterSpacing: '0.02em',
                        }}>
                          {risk.label}
                        </span>
                      </td>

                      {/* Compliance score */}
                      <td style={{ padding: '14px 20px' }}>
                        {score != null && score > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 80, height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                              <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: scoreColor(score), transition: 'width 0.5s' }} />
                            </div>
                            <span style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: scoreColor(score), lineHeight: 1 }}>
                              {score.toFixed(0)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textFaint }}>—</span>
                        )}
                      </td>

                      {/* Last assessment */}
                      <td style={{ padding: '14px 20px', fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
                        {vendor.last_assessment_date ? formatDate(vendor.last_assessment_date) : (
                          <span style={{ color: T.textFaint }}>Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                          <Link to={`/vendors/${vendor.id}`} style={{ textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                            <button style={actionBtnStyle(T.accent)}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.accentLight; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.accent}08`; }}
                            >
                              <Eye size={12} /> View
                            </button>
                          </Link>
                          <button
                            onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
                            style={actionBtnStyle(T.textSecondary)}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(100,116,139,0.1)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.textSecondary}08`; }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vendor)}
                            style={actionBtnStyle(T.danger)}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.dangerLight; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${T.danger}08`; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: T.textFaint }} />
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary }}>
              {search || riskFilter !== 'all' ? 'No vendors match filters' : 'No vendors yet'}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
              {search || riskFilter !== 'all' ? 'Try a different search term or filter' : 'Add your first vendor to start tracking risk'}
            </div>
            {!search && riskFilter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9,
                  background: T.accent, color: '#fff',
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer', marginTop: 4,
                }}
              >
                <Plus size={14} /> Add First Vendor
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: `1px solid ${T.borderLight}`,
            background: 'var(--surface-1)',
          }}>
            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
              Showing <strong style={{ color: T.textPrimary }}>{filtered.length}</strong> of{' '}
              <strong style={{ color: T.textPrimary }}>{vendors.length}</strong> vendors
            </span>
            <button
              onClick={() => navigate('/vendors/ranking')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.accent,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              View full ranking <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      <NewVendorModal isOpen={showModal} onClose={() => setShowModal(false)} onCreate={v => setVendors(prev => [...prev, v])} />
    </div>
  );
}
