import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Building2, Search, Trophy,
  AlertTriangle, TrendingUp, Shield,
  Eye, Pencil, Trash2, MoreVertical,
  ChevronDown, X, ChevronRight,
} from 'lucide-react';
import { vendorsApi } from '@/api/vendors';
import type { Vendor } from '@/types';
import { getErrorMessage, formatDate } from '@/api/client';
import NewVendorModal from '@/components/NewVendorModal';

// ── Design tokens (CSS vars) ──────────────────────────────────
const T = {
  card:        'var(--card)',
  border:      'var(--border)',
  borderLight: 'rgba(148,163,184,0.12)',
  bg:          'var(--bg)',
  surface2:    'var(--surface-2)',
  text1:       'var(--text-1)',
  text2:       'var(--text-2)',
  text3:       'var(--text-3)',
  accent:      'var(--accent)',
  accentLight: 'rgba(99,102,241,0.08)',
  success:     '#22C55E',
  warning:     '#F59E0B',
  danger:      '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  fontSans:    'var(--font-sans)',
  fontDisplay: 'var(--font-display)',
  fontMono:    'var(--font-mono)',
} as const;

const cardBase = {
  background:   T.card,
  border:       `1px solid ${T.border}`,
  borderRadius: 12,
} as const;

// ── Helpers ───────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 70) return T.success;
  if (s >= 50) return T.warning;
  return T.danger;
}

function riskConfig(tier: string | undefined | null) {
  switch (tier) {
    case 'critical': return { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)',   label: 'Critical' };
    case 'high':     return { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', border: 'rgba(245,158,11,0.25)',  label: 'High'     };
    case 'medium':   return { bg: 'rgba(99,102,241,0.1)',  color: '#6366F1', border: 'rgba(99,102,241,0.25)', label: 'Medium'   };
    case 'low':      return { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', border: 'rgba(34,197,94,0.25)',   label: 'Low'      };
    default:         return { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)', border: 'var(--border)', label: 'Unknown' };
  }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
const AVATAR_COLORS = ['#4F46E5','#0EA5E9','#16A34A','#D97706','#DC2626','#9333EA','#0891B2','#059669'];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Row Skeleton ──────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}
         className="animate-pulse">
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: T.borderLight, flexShrink: 0 }} />
        <div>
          <div style={{ width: 140, height: 13, borderRadius: 4, background: T.borderLight, marginBottom: 5 }} />
          <div style={{ width: 100, height: 10, borderRadius: 4, background: T.borderLight }} />
        </div>
      </div>
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ width: 70, height: 12, borderRadius: 4, background: T.borderLight }} />
      </div>
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ width: 64, height: 20, borderRadius: 100, background: T.borderLight }} />
      </div>
      <div style={{ flexShrink: 0, width: 130, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '100%', height: 4, borderRadius: 2, background: T.borderLight }} />
        <div style={{ width: 36, height: 10, borderRadius: 3, background: T.borderLight }} />
      </div>
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ width: 70, height: 11, borderRadius: 4, background: T.borderLight, marginLeft: 'auto' }} />
      </div>
      <div style={{ flexShrink: 0, width: 28 }} />
    </div>
  );
}

// ── Filter Tab ────────────────────────────────────────────────
function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 8,
        fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
        border: 'none', cursor: 'pointer', transition: 'all 0.14s',
        background: active ? T.accent : T.card,
        color:      active ? '#fff' : T.text2,
        boxShadow:  active ? '0 1px 3px rgba(99,102,241,0.3)' : 'none',
        outline:    active ? 'none' : `1px solid ${T.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ── Sort Dropdown ─────────────────────────────────────────────
type SortOption = { value: string; label: string };
function SortDropdown({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: SortOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const selected  = options.find(o => o.value === value) ?? options[0];
  const isDefault = value === options[0].value;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '7px 10px 7px 12px', borderRadius: 8,
          border: `1px solid ${isDefault ? T.border : T.accent}`,
          background: isDefault ? T.card : T.accentLight,
          fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
          color: isDefault ? T.text2 : T.accent,
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.14s',
        }}
      >
        {selected.label}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            minWidth: 170, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            boxShadow: '0 10px 30px rgba(15,23,42,0.15)', padding: '4px 0', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                  border: 'none', cursor: 'pointer', fontFamily: T.fontSans, fontSize: 12,
                  fontWeight: value === opt.value ? 700 : 400,
                  color: value === opt.value ? T.accent : T.text1,
                  background: value === opt.value ? T.accentLight : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.04)'; }}
                onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Col header ────────────────────────────────────────────────
function ColLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: T.text3,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Vendor Row ────────────────────────────────────────────────
function VendorRow({ vendor, onView, onEdit, onDelete }: {
  vendor: Vendor;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const score    = vendor.latest_assessment_score;
  const risk     = riskConfig(vendor.criticality_level ?? vendor.risk_tier);
  const color    = avatarColor(vendor.name);
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  return (
    <div
      onClick={onView}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 18px', cursor: 'pointer',
        background: hovered ? T.accentLight : 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar + name column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 800, color }}>
            {initials(vendor.name)}
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
            color: hovered ? T.accent : T.text1,
            transition: 'color 0.15s',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {vendor.name}
          </div>
          {vendor.contact_email && (
            <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.text3, marginTop: 2 }}>
              {vendor.contact_email}
            </div>
          )}
        </div>
      </div>

      {/* Industry column */}
      <div style={{
        flexShrink: 0, width: 110,
        fontFamily: T.fontSans, fontSize: 12, color: T.text2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {vendor.industry ?? <span style={{ color: T.text3 }}>—</span>}
      </div>

      {/* Risk badge column */}
      <div style={{ flexShrink: 0, width: 90 }}>
        <span style={{
          display: 'inline-flex', padding: '3px 9px', borderRadius: 100,
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
          letterSpacing: '0.02em', whiteSpace: 'nowrap',
        }}>
          {risk.label}
        </span>
      </div>

      {/* Score column */}
      <div style={{ flexShrink: 0, width: 130 }}>
        {score != null && score > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.borderLight, overflow: 'hidden' }}>
              <div style={{
                width: `${score}%`, height: '100%', borderRadius: 2,
                background: scoreColor(score), transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{
              fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, flexShrink: 0,
              color: scoreColor(score), minWidth: 34, textAlign: 'right',
            }}>
              {score.toFixed(0)}%
            </span>
          </div>
        ) : (
          <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3 }}>—</span>
        )}
      </div>

      {/* Last assessment column */}
      <div style={{
        flexShrink: 0, width: 90, textAlign: 'right',
        fontFamily: T.fontMono, fontSize: 10,
        color: vendor.last_assessment_date ? T.text3 : T.text3,
      }}>
        {vendor.last_assessment_date ? formatDate(vendor.last_assessment_date) : (
          <span style={{ fontStyle: 'italic' }}>Never</span>
        )}
      </div>

      {/* ⋮ menu */}
      <div
        style={{ flexShrink: 0, width: 28, position: 'relative' }}
        ref={menuRef}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: menuOpen ? T.accentLight : 'transparent',
            border: `1px solid ${menuOpen ? T.border : 'transparent'}`,
            cursor: 'pointer', color: T.text3, transition: 'all 0.12s',
          }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.background = T.surface2; b.style.color = T.text2; }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.background = menuOpen ? T.accentLight : 'transparent'; b.style.color = T.text3; }}
        >
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            width: 160, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
            padding: '4px 0', overflow: 'hidden',
          }}>
            {[
              { icon: <Eye size={12} />,    label: 'View Details', action: onView, color: T.text1  },
              { icon: <Pencil size={12} />, label: 'Edit Vendor',  action: onEdit, color: T.text2  },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => { item.action(); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 12px',
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                  color: item.color, background: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.accentLight; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: T.borderLight, margin: '3px 0' }} />
            <button
              onClick={() => { onDelete(); setMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 12px',
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                color: T.danger, background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.dangerLight; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function Vendors() {
  const navigate = useNavigate();
  const [vendors,    setVendors]    = useState<Vendor[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy,     setSortBy]     = useState('risk');
  const [showModal,  setShowModal]  = useState(false);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setVendors(await vendorsApi.list());
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      await vendorsApi.delete(vendor.id);
      setVendors(v => v.filter(x => x.id !== vendor.id));
    } catch (err) { setError(getErrorMessage(err)); }
  };

  // Stats
  const highRisk = useMemo(() => vendors.filter(v => (v.latest_assessment_score ?? 100) < 50), [vendors]);
  const critical = useMemo(() => vendors.filter(v => (v.criticality_level ?? v.risk_tier) === 'critical'), [vendors]);
  const avgScore = useMemo(() => {
    const scored = vendors.filter(v => (v.latest_assessment_score ?? 0) > 0);
    if (!scored.length) return 0;
    return scored.reduce((s, v) => s + (v.latest_assessment_score ?? 0), 0) / scored.length;
  }, [vendors]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = vendors.filter(v => {
      const tier = v.criticality_level ?? v.risk_tier;
      const matchSearch = !search.trim() ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.industry?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchRisk = riskFilter === 'all' || tier === riskFilter;
      return matchSearch && matchRisk;
    });
    result = [...result];
    if (sortBy === 'risk') {
      result.sort((a, b) => {
        const ta = a.criticality_level ?? a.risk_tier ?? 'medium';
        const tb = b.criticality_level ?? b.risk_tier ?? 'medium';
        return (RISK_ORDER[ta] ?? 2) - (RISK_ORDER[tb] ?? 2);
      });
    } else if (sortBy === 'score_high') {
      result.sort((a, b) => (b.latest_assessment_score ?? 0) - (a.latest_assessment_score ?? 0));
    } else if (sortBy === 'score_low') {
      result.sort((a, b) => (a.latest_assessment_score ?? 0) - (b.latest_assessment_score ?? 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => {
        const da = a.last_assessment_date ? new Date(a.last_assessment_date).getTime() : 0;
        const db = b.last_assessment_date ? new Date(b.last_assessment_date).getTime() : 0;
        return db - da;
      });
    }
    return result;
  }, [vendors, search, riskFilter, sortBy]);

  const isFiltered = !!(search || riskFilter !== 'all');

  if (error) {
    return (
      <div style={{ ...cardBase, padding: '16px 20px', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: '-0.02em', margin: 0 }}>
            Vendors
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, marginTop: 3, marginBottom: 0 }}>
            Third-party security posture management
            {!loading && vendors.length > 0 && (
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.text3, marginLeft: 8 }}>
                · {vendors.length} total
              </span>
            )}
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, marginTop: 4, marginBottom: 0, fontStyle: 'italic' }}>
            Group companies (subsidiaries) are managed under Group Companies.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/vendors/ranking')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: T.card, color: T.text2,
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
              border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = '#CBD5E1'; b.style.color = T.text1; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = T.border;  b.style.color = T.text2; }}
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
              boxShadow: '0 1px 3px rgba(99,102,241,0.3)',
              transition: 'opacity 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.opacity = '0.9'; b.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.opacity = '1';   b.style.boxShadow = '0 1px 3px rgba(99,102,241,0.3)'; }}
          >
            <Plus size={15} /> Add Vendor
          </button>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: <Building2 size={15} />,     label: 'Total Vendors', value: loading ? '—' : String(vendors.length),                   color: '#6366F1', lightBg: 'rgba(99,102,241,0.1)'  },
          { icon: <AlertTriangle size={15} />,  label: 'High Risk',     value: loading ? '—' : String(highRisk.length),                  color: '#EF4444', lightBg: 'rgba(239,68,68,0.1)'   },
          { icon: <TrendingUp size={15} />,     label: 'Avg Score',     value: loading ? '—' : avgScore > 0 ? `${avgScore.toFixed(0)}%` : '—', color: avgScore > 0 ? scoreColor(avgScore) : T.text3, lightBg: avgScore >= 70 ? 'rgba(34,197,94,0.1)' : avgScore >= 50 ? 'rgba(245,158,11,0.1)' : avgScore > 0 ? 'rgba(239,68,68,0.1)' : T.borderLight },
          { icon: <Shield size={15} />,         label: 'Critical',      value: loading ? '—' : String(critical.length),                  color: '#F59E0B', lightBg: 'rgba(245,158,11,0.1)' },
        ].map(k => (
          <div key={k.label} style={{ ...cardBase, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: k.lightBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color,
            }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>
                {k.value}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.text3, marginTop: 2 }}>
                {k.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Risk tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all',      label: 'All'      },
            { id: 'critical', label: 'Critical' },
            { id: 'high',     label: 'High'     },
            { id: 'medium',   label: 'Medium'   },
            { id: 'low',      label: 'Low'      },
          ].map(t => (
            <FilterTab key={t.id} label={t.label} active={riskFilter === t.id} onClick={() => setRiskFilter(t.id)} />
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Sort dropdown */}
        <SortDropdown
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'risk',       label: 'Risk Level'       },
            { value: 'score_high', label: 'Highest Score'    },
            { value: 'score_low',  label: 'Lowest Score'     },
            { value: 'name',       label: 'Name A → Z'       },
            { value: 'recent',     label: 'Recently Assessed'},
          ]}
        />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.text3, pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search vendors..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 200, paddingLeft: 32, paddingRight: search ? 28 : 12,
              paddingTop: 7, paddingBottom: 7,
              borderRadius: 8, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 12, color: T.text1,
              background: T.card, outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.accent; }}
            onBlur={e  => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: T.text3, padding: 0 }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ ...cardBase, overflow: 'hidden' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: T.borderLight, margin: '0 18px' }} />}
              <RowSkeleton />
            </div>
          ))}
        </div>

      ) : filtered.length === 0 ? (
        <div style={{
          ...cardBase, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: T.borderLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={24} style={{ color: T.text3 }} />
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.text1 }}>
            {isFiltered ? 'No vendors match filters' : 'No vendors yet'}
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, textAlign: 'center', maxWidth: 300 }}>
            {isFiltered
              ? 'Try a different search term or risk filter'
              : 'Add your first vendor to start tracking third-party risk'}
          </div>
          {!isFiltered && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9, marginTop: 4,
                background: T.accent, color: '#fff',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add First Vendor
            </button>
          )}
        </div>

      ) : (
        <div style={{ ...cardBase, overflow: 'hidden' }}>
          {/* Column header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 18px',
            background: T.surface2,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <ColLabel style={{ flex: 1 }}>Vendor</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 110 }}>Industry</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 90 }}>Risk Level</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 130 }}>Score</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 90, textAlign: 'right' }}>Last Assessed</ColLabel>
            <div style={{ flexShrink: 0, width: 28 }} />
          </div>

          {/* Rows */}
          {filtered.map((vendor, i) => (
            <div key={vendor.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              {i > 0 && <div style={{ height: 1, background: T.borderLight, margin: '0 18px' }} />}
              <VendorRow
                vendor={vendor}
                onView={() => navigate(`/vendors/${vendor.id}`)}
                onEdit={() => navigate(`/vendors/${vendor.id}/edit`)}
                onDelete={() => handleDelete(vendor)}
              />
            </div>
          ))}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 18px', borderTop: `1px solid ${T.borderLight}`,
            background: T.surface2,
          }}>
            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2 }}>
              Showing{' '}
              <strong style={{ color: T.text1 }}>{filtered.length}</strong>
              {isFiltered && vendors.length !== filtered.length && (
                <> of <strong style={{ color: T.text1 }}>{vendors.length}</strong></>
              )}
              {' '}vendor{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => navigate('/vendors/ranking')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.accent,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              View full ranking <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      <NewVendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={v => setVendors(prev => [...prev, v])}
      />
    </div>
  );
}
