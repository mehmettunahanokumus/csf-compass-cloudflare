import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Shield, MoreVertical,
  Eye, Trash2, Send,
  CheckCircle2, Clock, FileText, ArrowRight,
  ChevronDown, X,
} from 'lucide-react';
import { assessmentsApi } from '@/api/assessments';
import type { Assessment } from '@/types';
import { getErrorMessage } from '@/api/client';
import { T, card } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 70) return T.success;
  if (s >= 50) return T.warning;
  return T.danger;
}

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  completed:   { bg: T.successLight,             color: T.success,       label: 'Completed',   icon: <CheckCircle2 size={10} /> },
  in_progress: { bg: T.accentLight,              color: T.accent,        label: 'In Progress', icon: <Clock size={10} /> },
  draft:       { bg: 'rgba(148,163,184,0.1)',    color: T.textSecondary, label: 'Draft',       icon: <FileText size={10} /> },
};

function StatusPill({ status }: { status: string }) {
  const c = statusConfig[status] ?? statusConfig.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 100,
      fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Card skeleton ─────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ ...card, padding: 20 }} className="animate-pulse">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 64, height: 18, borderRadius: 5, background: T.border }} />
        <div style={{ width: 80, height: 18, borderRadius: 100, background: T.border }} />
      </div>
      <div style={{ width: '75%', height: 16, borderRadius: 5, background: T.border, marginBottom: 8 }} />
      <div style={{ width: '45%', height: 12, borderRadius: 5, background: T.borderLight, marginBottom: 20 }} />
      <div style={{ width: '100%', height: 5, borderRadius: 3, background: T.borderLight, marginBottom: 8 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${T.borderLight}` }}>
        <div style={{ width: 70, height: 11, borderRadius: 4, background: T.borderLight }} />
        <div style={{ width: 50, height: 11, borderRadius: 4, background: T.borderLight }} />
      </div>
    </div>
  );
}

// ── Assessment Card ───────────────────────────────────────────
interface CardProps {
  assessment: Assessment;
  onView: () => void;
  onDelete: () => void;
  onSendToVendor: () => void;
}

function AssessmentCard({ assessment, onView, onDelete, onSendToVendor }: CardProps) {
  const score = assessment.overall_score ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered,  setHovered]  = useState(false);

  return (
    <div
      onClick={onView}
      style={{
        ...card,
        padding: 20,
        cursor: 'pointer',
        border: `1px solid ${hovered ? '#CBD5E1' : T.border}`,
        boxShadow: hovered ? '0 6px 20px rgba(15,23,42,0.1)' : '0 1px 3px rgba(15,23,42,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s ease',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        {(() => {
          const isOrg = assessment.assessment_type === 'organization';
          const isGroup = !isOrg && !!assessment.vendor?.group_id;
          const tag = isOrg
            ? { label: 'Self', bg: 'rgba(99,102,241,0.12)', color: '#6366F1' }
            : isGroup
            ? { label: 'Group Company', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' }
            : { label: 'Vendor', bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' };
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 11, fontWeight: 600, fontFamily: T.fontSans,
              padding: '2px 7px', borderRadius: 4,
              background: tag.bg, color: tag.color,
            }}>
              {tag.label}
            </span>
          );
        })()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusPill status={assessment.status} />
          {/* Kebab menu */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 26, height: 26, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.textMuted, transition: 'all 0.12s',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#F1F5F9'; b.style.color = T.textSecondary; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = T.textMuted; }}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
                  width: 164, background: T.card,
                  border: `1px solid ${T.border}`, borderRadius: 10,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                  padding: '4px 0', overflow: 'hidden',
                }}>
                  {[
                    { icon: <Eye size={12} />,  label: 'View Details',   action: onView,         color: T.textPrimary },
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
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <div style={{
        fontFamily: T.fontSans, fontSize: 14, fontWeight: 700,
        color: hovered ? T.accent : T.textPrimary,
        transition: 'color 0.15s', marginBottom: 4, lineHeight: 1.35,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {assessment.name}
      </div>

      {/* Company tag */}
      {assessment.vendor ? (
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 500, fontFamily: T.fontSans,
            padding: '2px 7px', borderRadius: 4,
            background: '#F1F5F9', color: T.textSecondary,
            maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {assessment.vendor.name}
          </span>
        </div>
      ) : (
        <div style={{ height: 16 }} />
      )}

      {/* Score + bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, lineHeight: 1, color: score > 0 ? scoreColor(score) : T.textFaint }}>
          {score > 0 ? score.toFixed(0) : '—'}
        </div>
        {score > 0 && (
          <div style={{ fontSize: 13, color: T.textMuted, fontFamily: T.fontSans, alignSelf: 'flex-end', marginBottom: 2 }}>/ 100</div>
        )}
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden', marginLeft: 4 }}>
          {score > 0 && (
            <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: scoreColor(score), transition: 'width 0.5s ease' }} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, marginTop: 8, borderTop: `1px solid ${T.borderLight}`,
      }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textFaint }}>
          {new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span style={{
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          color: hovered ? T.accent : T.textMuted,
          display: 'flex', alignItems: 'center', gap: 3,
          transition: 'color 0.15s',
        }}>
          View <ArrowRight size={11} />
        </span>
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
        color:      active ? '#fff' : T.textSecondary,
        boxShadow:  active ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
        outline:    active ? 'none' : `1px solid ${T.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ── Filter Dropdown (no internal search) ─────────────────────
type DropdownOption = { value: string; label: string };
function FilterDropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
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
          color: isDefault ? T.textSecondary : T.accent,
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
                  color: value === opt.value ? T.accent : T.textPrimary,
                  background: value === opt.value ? T.accentLight : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.05)'; }}
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

// ── Entity Dropdown (with internal search for long lists) ─────
function EntityDropdown({ options, value, onChange, allLabel, buttonLabel, show }: {
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  buttonLabel: string;
  show: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [innerSearch, setInnerSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setInnerSearch(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  // Close and reset when show changes
  useEffect(() => {
    if (!show) { setOpen(false); setInnerSearch(''); }
  }, [show]);

  if (!show) return null;

  const showSearch = options.length > 5;
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
          color: isSelected ? T.accent : T.textSecondary,
          cursor: 'pointer', maxWidth: 200, transition: 'all 0.14s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel ?? buttonLabel}
        </span>
        <ChevronDown size={12} style={{
          flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s',
        }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => { setOpen(false); setInnerSearch(''); }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            minWidth: 210, maxWidth: 280, background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            boxShadow: '0 10px 30px rgba(15,23,42,0.15)', overflow: 'hidden',
          }}>
            {showSearch && (
              <div style={{ padding: '8px 8px 4px', borderBottom: `1px solid ${T.borderLight}` }}>
                <div style={{ position: 'relative' }}>
                  <Search size={11} style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    color: T.textMuted, pointerEvents: 'none',
                  }} />
                  <input
                    autoFocus
                    type="text"
                    value={innerSearch}
                    onChange={e => setInnerSearch(e.target.value)}
                    placeholder="Search..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                      border: `1px solid ${T.border}`, borderRadius: 6,
                      fontFamily: T.fontSans, fontSize: 11, color: T.textPrimary,
                      background: T.bg, outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
              {/* All option */}
              <button
                onClick={() => { onChange(''); setOpen(false); setInnerSearch(''); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 12px', border: 'none', cursor: 'pointer',
                  fontFamily: T.fontSans, fontSize: 12,
                  fontWeight: !value ? 700 : 400,
                  color: !value ? T.accent : T.textSecondary,
                  background: !value ? T.accentLight : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { if (value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                {allLabel}
              </button>

              {filtered.length === 0 && (
                <div style={{ padding: '8px 12px', fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>
                  No matches
                </div>
              )}

              {filtered.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); setInnerSearch(''); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 12px', border: 'none', cursor: 'pointer',
                    fontFamily: T.fontSans, fontSize: 12,
                    fontWeight: value === opt.value ? 700 : 400,
                    color: value === opt.value ? T.accent : T.textPrimary,
                    background: value === opt.value ? T.accentLight : 'transparent',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.05)'; }}
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

// ── Main ──────────────────────────────────────────────────────
export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Derive all filter state from URL params
  const search      = searchParams.get('q')      ?? '';
  const typeFilter  = searchParams.get('type')   ?? 'all';
  const entityFilter= searchParams.get('entity') ?? '';
  const statusFilter= searchParams.get('status') ?? 'all';
  const sortFilter  = searchParams.get('sort')   ?? 'newest';

  // URL param setters
  const setSearch = (q: string) =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      q ? next.set('q', q) : next.delete('q');
      return next;
    }, { replace: true });

  const setTypeFilter = (type: string) =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      type !== 'all' ? next.set('type', type) : next.delete('type');
      next.delete('entity'); // reset entity when type changes
      return next;
    });

  const setEntityFilter = (entity: string) =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      entity ? next.set('entity', entity) : next.delete('entity');
      return next;
    });

  const setStatusFilter = (status: string) =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      status !== 'all' ? next.set('status', status) : next.delete('status');
      return next;
    });

  const setSortFilter = (sort: string) =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      sort !== 'newest' ? next.set('sort', sort) : next.delete('sort');
      return next;
    });

  const isFiltered = !!(search || typeFilter !== 'all' || entityFilter || statusFilter !== 'all' || sortFilter !== 'newest');
  const clearFilters = () => setSearchParams({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await assessmentsApi.list();
      setAssessments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assessmentsApi.delete(id);
      setAssessments(a => a.filter(x => x.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Build entity option lists from loaded assessments
  const subsidiaries = useMemo<DropdownOption[]>(() => {
    const seen = new Set<string>();
    const out: DropdownOption[] = [];
    for (const a of assessments) {
      if (a.assessment_type === 'vendor' && a.vendor && a.vendor.group_id && a.vendor_id && !seen.has(a.vendor_id)) {
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
  const entityBtnLabel = typeFilter === 'group_company' ? 'Select company...' : 'Select vendor...';

  // Filtered + sorted assessments
  const filtered = useMemo(() => {
    let result = assessments;

    // Search (name + vendor name)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.vendor?.name?.toLowerCase().includes(q) ?? false)
      );
    }

    // Type filter
    if (typeFilter === 'self') {
      result = result.filter(a => a.assessment_type === 'organization');
    } else if (typeFilter === 'group_company') {
      result = result.filter(a => a.assessment_type === 'vendor' && !!a.vendor?.group_id);
    } else if (typeFilter === 'vendor') {
      result = result.filter(a => a.assessment_type === 'vendor' && !a.vendor?.group_id);
    }

    // Entity filter (specific subsidiary or vendor)
    if (entityFilter) {
      result = result.filter(a => a.vendor_id === entityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Sort
    result = [...result];
    if (sortFilter === 'oldest') {
      result.sort((a, b) => a.created_at - b.created_at);
    } else if (sortFilter === 'score_high') {
      result.sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
    } else if (sortFilter === 'score_low') {
      result.sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0));
    } else {
      // newest (default)
      result.sort((a, b) => b.created_at - a.created_at);
    }

    return result;
  }, [assessments, search, typeFilter, entityFilter, statusFilter, sortFilter]);

  const completed  = assessments.filter(a => a.status === 'completed').length;
  const inProgress = assessments.filter(a => a.status === 'in_progress').length;
  const drafts     = assessments.filter(a => a.status === 'draft').length;

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
            Assessments
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 3 }}>
            NIST CSF 2.0 security evaluations
            {assessments.length > 0 && (
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textFaint, marginLeft: 8 }}>
                · {assessments.length} total
              </span>
            )}
          </p>
        </div>
        <Link to="/assessments/new" style={{ textDecoration: 'none' }}>
          <button
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
            <Plus size={15} /> New Assessment
          </button>
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: <CheckCircle2 size={16} />, label: 'Completed',   count: completed,  color: T.success     },
          { icon: <Clock size={16} />,        label: 'In Progress', count: inProgress, color: T.accent      },
          { icon: <FileText size={16} />,     label: 'Draft',       count: drafts,     color: T.textMuted   },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `${s.color}10`, border: `1px solid ${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {loading ? '—' : s.count}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: T.textMuted, pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search assessments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: 200, paddingLeft: 32, paddingRight: search ? 28 : 12,
                paddingTop: 7, paddingBottom: 7,
                borderRadius: 8, border: `1px solid ${T.border}`,
                fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
                background: T.card, outline: 'none',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
              onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', color: T.textMuted, padding: 0,
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: T.borderLight }} />

          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'all',           label: 'All'        },
              { id: 'group_company', label: 'Group Co.'  },
              { id: 'vendor',        label: 'Vendor'     },
              { id: 'self',          label: 'Self'        },
            ].map(t => (
              <FilterTab
                key={t.id}
                label={t.label}
                active={typeFilter === t.id}
                onClick={() => setTypeFilter(t.id)}
              />
            ))}
          </div>

          {/* Entity dropdown — appears only when Group Co. or Vendor is selected */}
          <EntityDropdown
            options={entityOptions}
            value={entityFilter}
            onChange={setEntityFilter}
            allLabel={entityAllLabel}
            buttonLabel={entityBtnLabel}
            show={showEntityDropdown}
          />

          {/* Status dropdown */}
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all',         label: 'All Status'  },
              { value: 'completed',   label: 'Completed'   },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'draft',       label: 'Draft'       },
            ]}
          />

          {/* Sort dropdown */}
          <FilterDropdown
            value={sortFilter}
            onChange={setSortFilter}
            options={[
              { value: 'newest',     label: 'Newest First'   },
              { value: 'oldest',     label: 'Oldest First'   },
              { value: 'score_high', label: 'Highest Score'  },
              { value: 'score_low',  label: 'Lowest Score'   },
            ]}
          />

          {/* Clear filters */}
          {isFiltered && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 8,
                border: `1px solid rgba(239,68,68,0.25)`,
                background: 'rgba(239,68,68,0.06)',
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                color: T.danger, cursor: 'pointer', transition: 'all 0.14s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(239,68,68,0.12)'; b.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(239,68,68,0.06)'; b.style.borderColor = 'rgba(239,68,68,0.25)'; }}
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>

        {/* Result count */}
        {!loading && (
          <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
            Showing{' '}
            <span style={{ fontWeight: 700, color: T.textSecondary }}>{filtered.length}</span>
            {' '}assessment{filtered.length !== 1 ? 's' : ''}
            {isFiltered && assessments.length !== filtered.length && (
              <span style={{ color: T.textFaint }}> · {assessments.length} total</span>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          ...card, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 12,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} style={{ color: T.textFaint }} />
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary }}>
            {isFiltered ? 'No assessments match filters' : 'No assessments yet'}
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', maxWidth: 300 }}>
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
                color: T.textSecondary, cursor: 'pointer',
              }}
            >
              <X size={12} /> Clear all filters
            </button>
          ) : (
            <Link to="/assessments/new" style={{ textDecoration: 'none', marginTop: 4 }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9,
                background: T.accent, color: '#fff',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}>
                <Plus size={14} /> Create Assessment
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((a, i) => (
            <div key={a.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <AssessmentCard
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
