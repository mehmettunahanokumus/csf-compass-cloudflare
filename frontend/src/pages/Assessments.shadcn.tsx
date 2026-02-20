import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Shield, MoreVertical,
  Eye, Trash2, Send,
  CheckCircle2, Clock, FileText,
  ChevronDown, X,
} from 'lucide-react';
import { assessmentsApi } from '@/api/assessments';
import type { Assessment } from '@/types';
import { getErrorMessage } from '@/api/client';

// ── Design tokens (CSS vars) ──────────────────────────────────
const T = {
  card:        'var(--card)',
  border:      'var(--border)',
  borderLight: 'rgba(148,163,184,0.12)',
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
  fontMono:    'var(--font-mono)',
} as const;

const cardBase = {
  background:   T.card,
  border:       `1px solid ${T.border}`,
  borderRadius: 12,
} as const;

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function scoreColor(s: number) {
  if (s >= 70) return T.success;
  if (s >= 50) return T.warning;
  return T.danger;
}

// ── Status Pill ───────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  completed:   { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E',        label: 'Completed',   icon: <CheckCircle2 size={10} /> },
  in_progress: { bg: 'rgba(99,102,241,0.1)',  color: T.accent,         label: 'In Progress', icon: <Clock size={10} /> },
  draft:       { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)',  label: 'Draft',       icon: <FileText size={10} /> },
};
function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 100,
      fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Type Badge ────────────────────────────────────────────────
function TypeBadge({ assessment }: { assessment: Assessment }) {
  const isOrg   = assessment.assessment_type === 'organization';
  const isGroup = !isOrg && !!assessment.vendor?.group_id;
  const tag = isOrg
    ? { label: 'Self',      bg: 'rgba(99,102,241,0.12)',  color: '#6366F1' }
    : isGroup
    ? { label: 'Group Co.', bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6' }
    : { label: 'Vendor',    bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, fontFamily: T.fontSans,
      padding: '2px 7px', borderRadius: 4,
      background: tag.bg, color: tag.color, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {tag.label}
    </span>
  );
}

// ── Row Skeleton ──────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
         className="animate-pulse">
      <div style={{ width: 72, flexShrink: 0 }}>
        <div style={{ width: 56, height: 18, borderRadius: 4, background: T.borderLight }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ width: '50%', height: 13, borderRadius: 4, background: T.borderLight, marginBottom: 6 }} />
        <div style={{ width: '28%', height: 11, borderRadius: 4, background: T.borderLight }} />
      </div>
      <div style={{ flexShrink: 0, width: 96, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 18, borderRadius: 100, background: T.borderLight }} />
      </div>
      <div style={{ flexShrink: 0, width: 120, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '100%', height: 4, borderRadius: 2, background: T.borderLight }} />
        <div style={{ width: 36, height: 10, borderRadius: 3, background: T.borderLight }} />
      </div>
      <div style={{ flexShrink: 0, width: 90 }}>
        <div style={{ width: 70, height: 10, borderRadius: 3, background: T.borderLight, marginLeft: 'auto' }} />
      </div>
      <div style={{ flexShrink: 0, width: 28 }} />
    </div>
  );
}

// ── Assessment Row ────────────────────────────────────────────
function AssessmentRow({ assessment, onView, onDelete, onSendToVendor }: {
  assessment: Assessment;
  onView: () => void;
  onDelete: () => void;
  onSendToVendor: () => void;
}) {
  const score = assessment.overall_score ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered,  setHovered]  = useState(false);
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
        padding: '14px 18px', cursor: 'pointer',
        background: hovered ? T.accentLight : 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Type badge column */}
      <div style={{ flexShrink: 0, width: 72 }}>
        <TypeBadge assessment={assessment} />
      </div>

      {/* Name + company column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
          color: hovered ? T.accent : T.text1,
          transition: 'color 0.15s',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {assessment.name}
        </div>
        {assessment.vendor && (
          <span style={{
            display: 'inline-block', marginTop: 3,
            fontSize: 11, fontWeight: 500, fontFamily: T.fontSans,
            padding: '1px 7px', borderRadius: 4,
            background: T.borderLight, color: T.text2,
            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {assessment.vendor.name}
          </span>
        )}
      </div>

      {/* Status column */}
      <div style={{ flexShrink: 0, width: 96, display: 'flex', justifyContent: 'center' }}>
        <StatusPill status={assessment.status} />
      </div>

      {/* Score column */}
      <div style={{ flexShrink: 0, width: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.borderLight, overflow: 'hidden' }}>
            {score > 0 && (
              <div style={{
                width: `${score}%`, height: '100%', borderRadius: 2,
                background: scoreColor(score), transition: 'width 0.4s ease',
              }} />
            )}
          </div>
          <span style={{
            fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, flexShrink: 0,
            color: score > 0 ? scoreColor(score) : T.text3, minWidth: 34, textAlign: 'right',
          }}>
            {score > 0 ? `${score.toFixed(0)}%` : '—'}
          </span>
        </div>
      </div>

      {/* Date column */}
      <div style={{
        flexShrink: 0, width: 90, textAlign: 'right',
        fontFamily: T.fontMono, fontSize: 10, color: T.text3,
      }}>
        {fmtDate(assessment.created_at)}
      </div>

      {/* Actions column */}
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
            width: 168, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
            padding: '4px 0', overflow: 'hidden',
          }}>
            {[
              { icon: <Eye size={12} />, label: 'View Details', action: onView, color: T.text1 },
              ...(assessment.assessment_type === 'vendor'
                ? [{ icon: <Send size={12} />, label: 'Send to Vendor', action: onSendToVendor, color: T.accent }]
                : []),
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

// ── Filter Dropdown ───────────────────────────────────────────
type DropdownOption = { value: string; label: string };
function FilterDropdown({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: DropdownOption[];
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
  const selected = options.find(o => o.value === value) ?? options[0];
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
        <ChevronDown size={12} style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s', flexShrink: 0,
        }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            minWidth: 160, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
            padding: '4px 0', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 12px', border: 'none', cursor: 'pointer',
                  fontFamily: T.fontSans, fontSize: 12,
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

// ── Entity Dropdown ───────────────────────────────────────────
function EntityDropdown({ options, value, onChange, allLabel, buttonLabel, show }: {
  options: DropdownOption[]; value: string; onChange: (v: string) => void;
  allLabel: string; buttonLabel: string; show: boolean;
}) {
  const [open, setOpen]           = useState(false);
  const [innerSearch, setInner]   = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setInner(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => { if (!show) { setOpen(false); setInner(''); } }, [show]);
  if (!show) return null;

  const filtered = innerSearch
    ? options.filter(o => o.label.toLowerCase().includes(innerSearch.toLowerCase()))
    : options;
  const selectedLabel = options.find(o => o.value === value)?.label;
  const isSelected = !!value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '7px 10px 7px 12px', borderRadius: 8,
          border: `1px solid ${isSelected ? T.accent : T.border}`,
          background: isSelected ? T.accentLight : T.card,
          fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
          color: isSelected ? T.accent : T.text2,
          cursor: 'pointer', maxWidth: 200, transition: 'all 0.14s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel ?? buttonLabel}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => { setOpen(false); setInner(''); }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            minWidth: 210, maxWidth: 280, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            boxShadow: '0 10px 30px rgba(15,23,42,0.15)', overflow: 'hidden',
          }}>
            {options.length > 5 && (
              <div style={{ padding: '8px 8px 4px', borderBottom: `1px solid ${T.borderLight}` }}>
                <div style={{ position: 'relative' }}>
                  <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: T.text3, pointerEvents: 'none' }} />
                  <input
                    autoFocus type="text" value={innerSearch}
                    onChange={e => setInner(e.target.value)}
                    placeholder="Search..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                      border: `1px solid ${T.border}`, borderRadius: 6,
                      fontFamily: T.fontSans, fontSize: 11, color: T.text1,
                      background: T.surface2, outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
              <button
                onClick={() => { onChange(''); setOpen(false); setInner(''); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                  border: 'none', cursor: 'pointer', fontFamily: T.fontSans, fontSize: 12,
                  fontWeight: !value ? 700 : 400, color: !value ? T.accent : T.text2,
                  background: !value ? T.accentLight : 'transparent', transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.04)'; }}
                onMouseLeave={e => { if (value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {allLabel}
              </button>
              {filtered.length === 0 && (
                <div style={{ padding: '8px 12px', fontFamily: T.fontSans, fontSize: 11, color: T.text3, fontStyle: 'italic' }}>
                  No matches
                </div>
              )}
              {filtered.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); setInner(''); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px',
                    border: 'none', cursor: 'pointer', fontFamily: T.fontSans, fontSize: 12,
                    fontWeight: value === opt.value ? 700 : 400,
                    color: value === opt.value ? T.accent : T.text1,
                    background: value === opt.value ? T.accentLight : 'transparent',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.04)'; }}
                  onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Col header label ──────────────────────────────────────────
function ColLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase' as const, color: T.text3,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Assessments() {
  const [assessments, setAssessments]     = useState<Assessment[]>([]);
  const [loading,     setLoading]         = useState(true);
  const [error,       setError]           = useState<string | null>(null);
  const [searchParams, setSearchParams]   = useSearchParams();
  const navigate = useNavigate();

  const search       = searchParams.get('q')      ?? '';
  const typeFilter   = searchParams.get('type')   ?? 'all';
  const entityFilter = searchParams.get('entity') ?? '';
  const statusFilter = searchParams.get('status') ?? 'all';
  const sortFilter   = searchParams.get('sort')   ?? 'newest';

  const setSearch = (q: string) =>
    setSearchParams(prev => { const n = new URLSearchParams(prev); q ? n.set('q', q) : n.delete('q'); return n; }, { replace: true });
  const setTypeFilter = (type: string) =>
    setSearchParams(prev => { const n = new URLSearchParams(prev); type !== 'all' ? n.set('type', type) : n.delete('type'); n.delete('entity'); return n; });
  const setEntityFilter = (entity: string) =>
    setSearchParams(prev => { const n = new URLSearchParams(prev); entity ? n.set('entity', entity) : n.delete('entity'); return n; });
  const setStatusFilter = (status: string) =>
    setSearchParams(prev => { const n = new URLSearchParams(prev); status !== 'all' ? n.set('status', status) : n.delete('status'); return n; });
  const setSortFilter = (sort: string) =>
    setSearchParams(prev => { const n = new URLSearchParams(prev); sort !== 'newest' ? n.set('sort', sort) : n.delete('sort'); return n; });

  const isFiltered   = !!(search || typeFilter !== 'all' || entityFilter || statusFilter !== 'all' || sortFilter !== 'newest');
  const clearFilters = () => setSearchParams({});

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      setAssessments(await assessmentsApi.list());
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await assessmentsApi.delete(id);
      setAssessments(a => a.filter(x => x.id !== id));
    } catch (err) { setError(getErrorMessage(err)); }
  };

  // Entity option lists
  const subsidiaries = useMemo<DropdownOption[]>(() => {
    const seen = new Set<string>();
    const out: DropdownOption[] = [];
    for (const a of assessments) {
      if (a.assessment_type === 'vendor' && a.vendor?.group_id && a.vendor_id && !seen.has(a.vendor_id)) {
        seen.add(a.vendor_id);
        out.push({ value: a.vendor_id, label: a.vendor.name });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [assessments]);

  const externalVendors = useMemo<DropdownOption[]>(() => {
    const seen = new Set<string>();
    const out: DropdownOption[] = [];
    for (const a of assessments) {
      if (a.assessment_type === 'vendor' && a.vendor && !a.vendor.group_id && a.vendor_id && !seen.has(a.vendor_id)) {
        seen.add(a.vendor_id);
        out.push({ value: a.vendor_id, label: a.vendor.name });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [assessments]);

  const showEntityDropdown = typeFilter === 'group_company' || typeFilter === 'vendor';
  const entityOptions  = typeFilter === 'group_company' ? subsidiaries : externalVendors;
  const entityAllLabel = typeFilter === 'group_company' ? 'All Group Companies' : 'All Vendors';
  const entityBtnLabel = typeFilter === 'group_company' ? 'Select company...'   : 'Select vendor...';

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let result = assessments;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.vendor?.name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter === 'self')           result = result.filter(a => a.assessment_type === 'organization');
    else if (typeFilter === 'group_company') result = result.filter(a => a.assessment_type === 'vendor' && !!a.vendor?.group_id);
    else if (typeFilter === 'vendor')    result = result.filter(a => a.assessment_type === 'vendor' && !a.vendor?.group_id);
    if (entityFilter)                    result = result.filter(a => a.vendor_id === entityFilter);
    if (statusFilter !== 'all')          result = result.filter(a => a.status === statusFilter);
    result = [...result];
    if (sortFilter === 'oldest')        result.sort((a, b) => a.created_at - b.created_at);
    else if (sortFilter === 'score_high') result.sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
    else if (sortFilter === 'score_low')  result.sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0));
    else                                 result.sort((a, b) => b.created_at - a.created_at);
    return result;
  }, [assessments, search, typeFilter, entityFilter, statusFilter, sortFilter]);

  // Stats
  const completed  = useMemo(() => assessments.filter(a => a.status === 'completed').length,   [assessments]);
  const inProgress = useMemo(() => assessments.filter(a => a.status === 'in_progress').length,  [assessments]);
  const drafts     = useMemo(() => assessments.filter(a => a.status === 'draft').length,        [assessments]);
  const avgScore   = useMemo(() => {
    const scored = assessments.filter(a => a.status === 'completed' && (a.overall_score ?? 0) > 0);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((s, a) => s + (a.overall_score ?? 0), 0) / scored.length);
  }, [assessments]);

  if (error) {
    return (
      <div style={{ ...cardBase, padding: '16px 20px', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
      </div>
    );
  }

  const avgScoreColor = avgScore >= 70 ? T.success : avgScore >= 50 ? T.warning : avgScore > 0 ? T.danger : T.text3;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.text1, letterSpacing: '-0.02em', margin: 0 }}>
            Assessments
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, marginTop: 3, marginBottom: 0 }}>
            NIST CSF 2.0 security evaluations
            {!loading && assessments.length > 0 && (
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.text3, marginLeft: 8 }}>
                · {assessments.length} total
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/assessments/new')}
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
          <Plus size={15} /> New Assessment
        </button>
      </div>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: <CheckCircle2 size={15} />, label: 'Completed',   value: loading ? '—' : String(completed),  color: '#22C55E',      lightBg: 'rgba(34,197,94,0.1)'  },
          { icon: <Clock size={15} />,        label: 'In Progress', value: loading ? '—' : String(inProgress), color: T.accent,      lightBg: 'rgba(99,102,241,0.1)' },
          { icon: <FileText size={15} />,     label: 'Draft',       value: loading ? '—' : String(drafts),     color: T.text3,        lightBg: T.borderLight          },
          { icon: <Shield size={15} />,       label: 'Avg Score',   value: loading ? '—' : (avgScore > 0 ? `${avgScore}%` : '—'), color: avgScoreColor, lightBg: avgScore >= 70 ? 'rgba(34,197,94,0.1)' : avgScore >= 50 ? 'rgba(245,158,11,0.1)' : avgScore > 0 ? 'rgba(239,68,68,0.1)' : T.borderLight },
        ].map(s => (
          <div key={s.label} style={{ ...cardBase, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: s.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: T.fontMono, fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.text3, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.text3, pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search assessments..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: 210, paddingLeft: 32, paddingRight: search ? 28 : 12,
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

          <div style={{ width: 1, height: 24, background: T.borderLight }} />

          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'all',           label: 'All'       },
              { id: 'group_company', label: 'Group Co.' },
              { id: 'vendor',        label: 'Vendor'    },
              { id: 'self',          label: 'Self'      },
            ].map(t => (
              <FilterTab key={t.id} label={t.label} active={typeFilter === t.id} onClick={() => setTypeFilter(t.id)} />
            ))}
          </div>

          <EntityDropdown
            options={entityOptions} value={entityFilter} onChange={setEntityFilter}
            allLabel={entityAllLabel} buttonLabel={entityBtnLabel} show={showEntityDropdown}
          />

          <FilterDropdown
            value={statusFilter} onChange={setStatusFilter}
            options={[
              { value: 'all',         label: 'All Status'  },
              { value: 'completed',   label: 'Completed'   },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'draft',       label: 'Draft'       },
            ]}
          />

          <FilterDropdown
            value={sortFilter} onChange={setSortFilter}
            options={[
              { value: 'newest',     label: 'Newest First'  },
              { value: 'oldest',     label: 'Oldest First'  },
              { value: 'score_high', label: 'Highest Score' },
              { value: 'score_low',  label: 'Lowest Score'  },
            ]}
          />

          {isFiltered && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)',
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                color: T.danger, cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(239,68,68,0.12)'; b.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(239,68,68,0.06)'; b.style.borderColor = 'rgba(239,68,68,0.25)'; }}
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>

        {!loading && (
          <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2 }}>
            Showing{' '}
            <span style={{ fontWeight: 700, color: T.text1 }}>{filtered.length}</span>
            {' '}assessment{filtered.length !== 1 ? 's' : ''}
            {isFiltered && assessments.length !== filtered.length && (
              <span style={{ color: T.text3 }}> · {assessments.length} total</span>
            )}
          </div>
        )}
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ ...cardBase, overflow: 'hidden' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: T.borderLight, margin: '0 18px' }} />}
              <RowSkeleton />
            </div>
          ))}
        </div>

      ) : filtered.length === 0 ? (
        <div style={{
          ...cardBase,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 12,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: T.borderLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={24} style={{ color: T.text3 }} />
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.text1 }}>
            {isFiltered ? 'No assessments match filters' : 'No assessments yet'}
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, textAlign: 'center', maxWidth: 300 }}>
            {isFiltered
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first security assessment to start evaluating NIST CSF compliance'}
          </div>
          {isFiltered ? (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, marginTop: 4,
                border: `1px solid ${T.border}`, background: T.card,
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                color: T.text2, cursor: 'pointer',
              }}
            >
              <X size={12} /> Clear all filters
            </button>
          ) : (
            <button
              onClick={() => navigate('/assessments/new')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9, marginTop: 4,
                background: T.accent, color: '#fff',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Create Assessment
            </button>
          )}
        </div>

      ) : (
        <div style={{ ...cardBase, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 18px',
            background: T.surface2,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <ColLabel style={{ flexShrink: 0, width: 72 }}>Type</ColLabel>
            <ColLabel style={{ flex: 1 }}>Assessment</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 96, textAlign: 'center' }}>Status</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 120 }}>Score</ColLabel>
            <ColLabel style={{ flexShrink: 0, width: 90, textAlign: 'right' }}>Created</ColLabel>
            <div style={{ flexShrink: 0, width: 28 }} />
          </div>

          {/* Rows */}
          {filtered.map((a, i) => (
            <div key={a.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              {i > 0 && <div style={{ height: 1, background: T.borderLight, margin: '0 18px' }} />}
              <AssessmentRow
                assessment={a}
                onView={() => navigate(`/assessments/${a.id}`)}
                onDelete={() => handleDelete(a.id)}
                onSendToVendor={() => navigate(`/assessments/${a.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
