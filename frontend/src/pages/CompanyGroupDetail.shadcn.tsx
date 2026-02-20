import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, Upload, RefreshCw, Plus,
  Pencil, Trash2, X, ChevronRight, ChevronDown,
  MoreHorizontal, FileCheck, BarChart3, Building2,
} from 'lucide-react';
import { companyGroupsApi } from '../api/company-groups';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { GroupSummary, Vendor, Assessment } from '../types';
import ExcelImportModal from '../components/import/ExcelImportModal';

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  danger:      '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  fontSans:    'var(--font-sans)',
  fontMono:    'var(--font-mono)',
} as const;

const cardBase = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366F1','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#3B82F6','#10B981','#F97316'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

function riskConfig(level: string | undefined | null) {
  switch (level) {
    case 'critical': return { bg: 'rgba(239,68,68,0.1)',  color: '#EF4444', border: 'rgba(239,68,68,0.25)',  label: 'Critical' };
    case 'high':     return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)', label: 'High'     };
    case 'medium':   return { bg: 'rgba(99,102,241,0.1)', color: '#6366F1', border: 'rgba(99,102,241,0.25)',label: 'Medium'   };
    case 'low':      return { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)',  label: 'Low'      };
    default:         return { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)', border: 'var(--border)', label: 'None' };
  }
}

function ScoreText({ score }: { score: number | null | undefined }) {
  if (score == null) return <span style={{ color: T.text3, fontFamily: T.fontMono, fontSize: 13 }}>—</span>;
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';
  return <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color }}>{score.toFixed(1)}%</span>;
}

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  completed:   { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E' },
  in_progress: { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
  draft:       { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <span style={{
      fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
      padding: '3px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ColLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
      color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em',
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─── Sub-form types ───────────────────────────────────────────────────────────
type CritLevel = 'low' | 'medium' | 'high' | 'critical';

interface SubForm {
  name: string; notes: string; criticality_level: CritLevel;
  industry: string; contact_name: string; contact_email: string; contact_phone: string;
}

const EMPTY_FORM: SubForm = {
  name: '', notes: '', criticality_level: 'medium',
  industry: '', contact_name: '', contact_email: '', contact_phone: '',
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateShort(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 7)  return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w === 1) return '1 week ago';
  if (w < 5)  return `${w} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}
function monthLabel(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ─── SubsidiaryRow component ──────────────────────────────────────────────────
interface VendorSummary { vendor: Vendor; overall_score?: number | null; latest_assessment?: Assessment | null }

function SubsidiaryRow({ vs, onEdit, onDelete }: {
  vs: VendorSummary;
  onEdit: (v: Vendor) => void;
  onDelete: (v: Vendor) => void;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const risk = riskConfig(vs.vendor.criticality_level ?? vs.vendor.risk_tier);
  const color = avatarColor(vs.vendor.name);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px',
        borderBottom: `1px solid ${T.borderLight}`,
        background: hovered ? T.accentLight : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Avatar */}
      <div
        onClick={() => navigate(`/vendors/${vs.vendor.id}`)}
        style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color }}>
          {vs.vendor.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name + assessment */}
      <div
        onClick={() => navigate(`/vendors/${vs.vendor.id}`)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div style={{
          fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.text1,
          display: 'flex', alignItems: 'center', gap: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {vs.vendor.name}
          <ChevronRight size={12} style={{ color: T.text3, flexShrink: 0 }} />
        </div>
        {vs.latest_assessment && (
          <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, marginTop: 2 }}>
            {vs.latest_assessment.name}
          </div>
        )}
      </div>

      {/* Risk badge */}
      <div style={{ flexShrink: 0, width: 82 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: T.fontMono,
          padding: '3px 8px', borderRadius: 20,
          background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          display: 'inline-block',
        }}>
          {risk.label}
        </span>
      </div>

      {/* Industry */}
      <div style={{ flexShrink: 0, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2 }}>
          {vs.vendor.industry || '—'}
        </span>
      </div>

      {/* Score */}
      <div style={{ flexShrink: 0, width: 72, textAlign: 'right' }}>
        <ScoreText score={vs.overall_score} />
      </div>

      {/* ⋮ menu */}
      <div style={{ flexShrink: 0, width: 28, position: 'relative' }} ref={menuRef} onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: menuOpen ? `1px solid ${T.border}` : '1px solid transparent',
            background: menuOpen ? T.surface2 : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.text3, transition: 'all 0.12s',
          }}
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 32, zIndex: 30,
            ...cardBase, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            minWidth: 150, overflow: 'hidden',
          }}>
            <button
              onClick={() => { setMenuOpen(false); onEdit(vs.vendor); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px', border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: T.fontSans, fontSize: 13, color: T.text1,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.accentLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Pencil size={13} style={{ color: T.text3 }} /> Edit
            </button>
            <div style={{ height: 1, background: T.borderLight, margin: '2px 0' }} />
            <button
              onClick={() => { setMenuOpen(false); onDelete(vs.vendor); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px', border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: T.fontSans, fontSize: 13, color: T.danger,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.dangerLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={13} style={{ color: T.danger }} /> Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Line chart colors ────────────────────────────────────────────────────────
const LINE_COLORS = ['#6366F1','#22C55E','#F59E0B','#EF4444','#818CF8','#FB923C','#38BDF8','#A78BFA'];

// ─── Main component ───────────────────────────────────────────────────────────
export default function CompanyGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [summary,        setSummary]        = useState<GroupSummary | null>(null);
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [toast,          setToast]          = useState<string | null>(null);

  const [activeTab,       setActiveTab]       = useState<'overview' | 'assessments' | 'trend'>('overview');
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const collapsedInitRef = useRef(false);
  const [showImport,   setShowImport]   = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Add/Edit subsidiary modal
  const [showSubModal,  setShowSubModal]  = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [subForm,       setSubForm]       = useState<SubForm>(EMPTY_FORM);
  const [submitting,    setSubmitting]    = useState(false);
  const [subError,      setSubError]      = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node))
        setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, assessments] = await Promise.all([
        companyGroupsApi.getSummary(id!),
        assessmentsApi.list(),
      ]);
      setSummary(summaryRes.data);
      setAllAssessments(assessments);
      collapsedInitRef.current = false;
    } catch {
      setError('Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────
  const vendorIds = useMemo(
    () => new Set(summary?.vendors.map(v => v.vendor.id) ?? []),
    [summary]
  );

  const groupAssessments = useMemo(() =>
    allAssessments
      .filter(a => a.vendor_id && vendorIds.has(a.vendor_id))
      .sort((a, b) => b.created_at - a.created_at),
    [allAssessments, vendorIds]
  );

  const assessmentsByMonth = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, Assessment[]> = {};
    groupAssessments.forEach(a => {
      const key = monthLabel(a.created_at);
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(a);
    });
    return order.map(k => [k, map[k]] as [string, Assessment[]]);
  }, [groupAssessments]);

  useEffect(() => {
    if (collapsedInitRef.current || assessmentsByMonth.length === 0) return;
    collapsedInitRef.current = true;
    if (assessmentsByMonth.length > 1) {
      setCollapsedMonths(new Set(assessmentsByMonth.slice(1).map(([k]) => k)));
    }
  }, [assessmentsByMonth]);

  const stats = useMemo(() => {
    if (!summary) return { totalAssessments: 0, avgScore: null as number | null, lastUpdate: null as number | null };
    const scored = summary.vendors.filter(v => v.overall_score != null);
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((s, v) => s + (v.overall_score ?? 0), 0) / scored.length * 10) / 10
      : null;
    const lastUpdate = summary.vendors.reduce<number | null>((max, v) => {
      if (!v.latest_assessment) return max;
      const ts = v.latest_assessment.created_at;
      return max === null || ts > max ? ts : max;
    }, null);
    return { totalAssessments: groupAssessments.length, avgScore, lastUpdate };
  }, [summary, groupAssessments]);

  const { trendData, trendVendorNames } = useMemo(() => {
    if (!summary) return { trendData: [], trendVendorNames: [] };
    const vendorNames: Record<string, string> = {};
    summary.vendors.forEach(v => { vendorNames[v.vendor.id] = v.vendor.name; });
    const byVendor: Record<string, Assessment[]> = {};
    groupAssessments.forEach(a => {
      if (!a.vendor_id) return;
      (byVendor[a.vendor_id] ??= []).push(a);
    });
    Object.values(byVendor).forEach(arr => arr.sort((a, b) => a.created_at - b.created_at));
    const dates = [...new Set(groupAssessments.map(a => a.created_at))].sort((a, b) => a - b);
    const points = dates.map(ts => {
      const pt: Record<string, string | number> = { date: fmtDateShort(ts) };
      Object.entries(byVendor).forEach(([vid, vas]) => {
        const match = vas.find(a => a.created_at === ts);
        if (match?.overall_score != null)
          pt[vendorNames[vid] ?? vid] = Math.round(match.overall_score * 10) / 10;
      });
      return pt;
    });
    return { trendData: points, trendVendorNames: Object.values(vendorNames) };
  }, [summary, groupAssessments]);

  // ─── Modal handlers ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingVendor(null); setSubForm(EMPTY_FORM); setSubError(null); setShowSubModal(true);
  };
  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setSubForm({
      name: vendor.name, notes: vendor.notes || '',
      criticality_level: (vendor.criticality_level || vendor.risk_tier || 'medium') as CritLevel,
      industry: vendor.industry || '', contact_name: vendor.contact_name || '',
      contact_email: vendor.contact_email || '', contact_phone: vendor.contact_phone || '',
    });
    setSubError(null); setShowSubModal(true);
  };
  const handleSubSubmit = async () => {
    if (!subForm.name.trim()) return;
    setSubmitting(true); setSubError(null);
    try {
      if (editingVendor) {
        await vendorsApi.update(editingVendor.id, {
          name: subForm.name, notes: subForm.notes || undefined,
          criticality_level: subForm.criticality_level,
          industry: subForm.industry || undefined,
          contact_name: subForm.contact_name || undefined,
          contact_email: subForm.contact_email || undefined,
          contact_phone: subForm.contact_phone || undefined,
        });
        showToast(`${subForm.name} updated`);
      } else {
        await vendorsApi.create({
          name: subForm.name, notes: subForm.notes || undefined,
          criticality_level: subForm.criticality_level,
          industry: subForm.industry || undefined,
          contact_name: subForm.contact_name || undefined,
          contact_email: subForm.contact_email || undefined,
          contact_phone: subForm.contact_phone || undefined,
          group_id: id!,
        });
        showToast(`${subForm.name} added`);
      }
      setShowSubModal(false); loadData();
    } catch {
      setSubError(editingVendor ? 'Failed to update' : 'Failed to add subsidiary');
    } finally { setSubmitting(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vendorsApi.delete(deleteTarget.id);
      const name = deleteTarget.name;
      setDeleteTarget(null); showToast(`${name} removed`); loadData();
    } catch { /* keep dialog open */ } finally { setDeleting(false); }
  };

  const toggleMonth = (key: string) =>
    setCollapsedMonths(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '8px 12px',
    fontFamily: T.fontSans, fontSize: 13, color: T.text1, outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: T.fontSans,
    fontSize: 11, fontWeight: 600, color: T.text3,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
  };

  // ─── Loading / error ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ height: 13, width: 160, background: T.borderLight, borderRadius: 6, marginBottom: 24 }} />
      <div style={{ ...cardBase, padding: '22px 28px', marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: T.borderLight }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 20, width: '30%', background: T.borderLight, borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 13, width: '20%', background: T.borderLight, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
  if (error || !summary) return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ background: T.dangerLight, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#FCA5A5', fontFamily: T.fontSans, fontSize: 13 }}>
        {error || 'Group not found'}
      </div>
    </div>
  );

  const { group, csf_functions, vendors: vendorSummaries } = summary;
  const groupRisk = riskConfig(group.risk_level);
  const headerColor = avatarColor(group.name);
  const scoreColor = stats.avgScore != null
    ? stats.avgScore >= 70 ? '#22C55E' : stats.avgScore >= 40 ? '#F59E0B' : '#EF4444'
    : T.text3;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          ...cardBase, border: '1px solid rgba(34,197,94,0.4)',
          padding: '10px 18px',
          fontFamily: T.fontSans, fontSize: 13, color: '#22C55E',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate('/company-groups')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.text2, fontFamily: T.fontSans, fontSize: 13, padding: 0, marginBottom: 20,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
        onMouseLeave={e => (e.currentTarget.style.color = T.text2)}
      >
        <ArrowLeft size={14} /> Back to Group Companies
      </button>

      {/* Header card */}
      <div style={{ ...cardBase, padding: '22px 28px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Letter avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: `${headerColor}22`, border: `1px solid ${headerColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 700, color: headerColor }}>
                {group.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.text1, margin: 0 }}>
                {group.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {group.industry && (
                  <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2 }}>{group.industry}</span>
                )}
                {group.industry && <span style={{ color: T.text3, fontSize: 11 }}>·</span>}
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: T.fontMono,
                  padding: '3px 9px', borderRadius: 20,
                  background: groupRisk.bg, color: groupRisk.color, border: `1px solid ${groupRisk.border}`,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {groupRisk.label}
                </span>
                {stats.lastUpdate && (
                  <>
                    <span style={{ color: T.text3, fontSize: 11 }}>·</span>
                    <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2 }}>
                      Last assessed {fmtDate(stats.lastUpdate)}
                    </span>
                  </>
                )}
              </div>
              {group.description && (
                <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, margin: '7px 0 0', lineHeight: 1.55 }}>
                  {group.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={openAddModal}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: T.accent, border: 'none', borderRadius: 8,
                padding: '8px 14px', color: '#fff',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Subsidiary
            </button>
            <div ref={moreMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMoreMenu(p => !p)}
                style={{
                  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: showMoreMenu ? T.surface2 : 'transparent',
                  border: `1px solid ${showMoreMenu ? T.border : 'transparent'}`,
                  borderRadius: 8, cursor: 'pointer', color: T.text2,
                  transition: 'all 0.12s',
                }}
              >
                <MoreHorizontal size={16} />
              </button>
              {showMoreMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  ...cardBase, padding: '4px 0', minWidth: 160, zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  {([
                    { icon: Upload,    label: 'Import Excel', action: () => { setShowImport(true); setShowMoreMenu(false); } },
                    { icon: RefreshCw, label: 'Refresh',      action: () => { loadData(); setShowMoreMenu(false); } },
                  ] as const).map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                        cursor: 'pointer', fontFamily: T.fontSans, fontSize: 13, color: T.text1, textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.accentLight)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <item.icon size={14} style={{ color: T.text3 }} /> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {([
          { label: 'Subsidiaries',       value: vendorSummaries.length,     sub: 'group entities',       color: '#A5B4FC' },
          { label: 'Total Assessments',  value: stats.totalAssessments,     sub: 'across all companies', color: '#818CF8' },
          { label: 'Avg Score',
            value: stats.avgScore != null ? `${stats.avgScore}%` : '—',
            sub: stats.avgScore != null
              ? stats.avgScore >= 70 ? 'Good compliance' : stats.avgScore >= 40 ? 'Needs improvement' : 'High risk'
              : 'No data yet',
            color: scoreColor },
          { label: 'Last Update',
            value: stats.lastUpdate ? timeAgo(stats.lastUpdate) : '—',
            sub: stats.lastUpdate ? fmtDate(stats.lastUpdate) : 'No assessments yet',
            color: T.text2 },
        ] as const).map(stat => (
          <div key={stat.label} style={{ ...cardBase, padding: '16px 18px' }}>
            <div style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
              {String(stat.value)}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.text2, marginTop: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, marginTop: 2 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
        {([
          { key: 'overview',    label: 'Overview',                                                                          Icon: Building2 },
          { key: 'assessments', label: `Assessments${stats.totalAssessments > 0 ? ` (${stats.totalAssessments})` : ''}`,   Icon: FileCheck },
          { key: 'trend',       label: 'Compliance Trend',                                                                  Icon: BarChart3 },
        ] as const).map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: T.fontSans, fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? T.accent : T.text2,
                borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.14s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.text1; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.text2; }}
            >
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Subsidiaries table */}
          <div style={{ ...cardBase, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 18px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1, margin: 0 }}>
                Subsidiary Companies
              </h2>
              <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3 }}>
                {vendorSummaries.length} {vendorSummaries.length === 1 ? 'company' : 'companies'}
              </span>
            </div>

            {vendorSummaries.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <Building2 size={32} style={{ color: T.text3, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, margin: '0 0 6px' }}>No subsidiaries yet</p>
                <button
                  onClick={openAddModal}
                  style={{ background: 'none', border: 'none', color: T.accent, fontFamily: T.fontSans, fontSize: 13, cursor: 'pointer', padding: 0 }}
                >
                  Add the first one →
                </button>
              </div>
            ) : (
              <>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 18px',
                  background: T.surface2, borderBottom: `1px solid ${T.border}`,
                }}>
                  <div style={{ flexShrink: 0, width: 34 }} />
                  <ColLabel style={{ flex: 1 }}>Company</ColLabel>
                  <ColLabel style={{ flexShrink: 0, width: 82 }}>Risk</ColLabel>
                  <ColLabel style={{ flexShrink: 0, width: 120 }}>Industry</ColLabel>
                  <ColLabel style={{ flexShrink: 0, width: 72, textAlign: 'right' }}>Score</ColLabel>
                  <div style={{ flexShrink: 0, width: 28 }} />
                </div>
                {vendorSummaries.map(vs => (
                  <SubsidiaryRow
                    key={vs.vendor.id}
                    vs={vs}
                    onEdit={openEditModal}
                    onDelete={v => setDeleteTarget(v)}
                  />
                ))}
              </>
            )}
          </div>

          {/* CSF Function Scores comparison table */}
          {vendorSummaries.length > 0 && csf_functions.length > 0 && (
            <div style={{ ...cardBase, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}` }}>
                <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1, margin: 0 }}>
                  CSF Function Scores by Company
                </h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
                      <th style={{ textAlign: 'left', padding: '10px 18px', fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 160 }}>Company</th>
                      <th style={{ textAlign: 'center', padding: '10px 14px', fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Overall</th>
                      {csf_functions.map(fn => (
                        <th key={fn.id} style={{ textAlign: 'center', padding: '10px 14px', fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 80 }}>
                          {fn.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendorSummaries.map((vs, idx) => (
                      <tr
                        key={vs.vendor.id}
                        style={{ borderBottom: idx < vendorSummaries.length - 1 ? `1px solid ${T.borderLight}` : 'none', cursor: 'pointer' }}
                        onClick={() => navigate(`/vendors/${vs.vendor.id}`)}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = T.accentLight}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 500, color: T.text1 }}>{vs.vendor.name}</div>
                          {vs.latest_assessment && (
                            <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, marginTop: 2 }}>{vs.latest_assessment.name}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}><ScoreText score={vs.overall_score} /></td>
                        {csf_functions.map(fn => (
                          <td key={fn.id} style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <ScoreText score={vs.function_scores[fn.id]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ASSESSMENTS ═══════════════════════════════════════════════════════ */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groupAssessments.length === 0 ? (
            <div style={{ ...cardBase, padding: '48px 20px', textAlign: 'center', color: T.text2, fontFamily: T.fontSans, fontSize: 13 }}>
              No assessments found for companies in this group.
            </div>
          ) : assessmentsByMonth.map(([month, monthAssessments]) => {
            const collapsed = collapsedMonths.has(month);
            return (
              <div key={month} style={{ ...cardBase, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleMonth(month)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '12px 18px', background: 'none', border: 'none',
                    cursor: 'pointer', borderBottom: collapsed ? 'none' : `1px solid ${T.borderLight}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {collapsed
                      ? <ChevronRight size={15} style={{ color: T.text3, flexShrink: 0 }} />
                      : <ChevronDown  size={15} style={{ color: T.text2, flexShrink: 0 }} />
                    }
                    <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.text2 }}>
                      {month}
                    </span>
                    <span style={{
                      fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
                      padding: '2px 7px', borderRadius: 20,
                      background: T.accentLight, color: T.accent,
                    }}>
                      {monthAssessments.length} assessment{monthAssessments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>

                {!collapsed && monthAssessments.map((a, aIdx) => {
                  const vendorName = summary.vendors.find(v => v.vendor.id === a.vendor_id)?.vendor.name;
                  const score = a.overall_score;
                  const sc = score != null
                    ? score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444'
                    : T.text3;
                  return (
                    <div
                      key={a.id}
                      onClick={() => navigate(`/assessments/${a.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 18px',
                        borderBottom: aIdx < monthAssessments.length - 1 ? `1px solid ${T.borderLight}` : 'none',
                        cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.accentLight}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.text1, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          {vendorName && <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text2 }}>{vendorName}</span>}
                          {vendorName && <span style={{ color: T.text3, fontSize: 10 }}>·</span>}
                          <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3 }}>{fmtDate(a.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, flexShrink: 0 }}>
                        <span style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: sc }}>
                          {score != null ? `${score.toFixed(1)}%` : '—'}
                        </span>
                        <StatusBadge status={a.status} />
                        <ChevronRight size={14} style={{ color: T.text3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TREND ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'trend' && (
        <div style={{ ...cardBase, padding: '22px 24px' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1, margin: 0 }}>
              Compliance Score Trend
            </h2>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2, margin: '5px 0 0' }}>
              Score progression over time — one line per subsidiary
            </p>
          </div>
          {trendData.length < 2 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.text2, fontFamily: T.fontSans, fontSize: 13, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
              {trendData.length === 0
                ? 'No assessment data yet. Scores will appear here once assessments are completed.'
                : 'At least 2 data points across different dates are needed to show a trend.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={trendData} margin={{ top: 5, right: 24, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} />
                <XAxis
                  dataKey="date"
                  tick={{ fontFamily: T.fontSans, fontSize: 11, fill: 'var(--text-3)' }}
                  axisLine={{ stroke: T.borderLight }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontFamily: T.fontMono, fontSize: 11, fill: 'var(--text-3)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: T.fontSans, fontSize: 12 }}
                  labelStyle={{ color: T.text1, fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number) => [`${v}%`, '']}
                />
                <Legend wrapperStyle={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2, paddingTop: 14 }} />
                {trendVendorNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: LINE_COLORS[i % LINE_COLORS.length], r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Add / Edit Subsidiary Modal ─────────────────────────────────────── */}
      {showSubModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ ...cardBase, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.text1, margin: 0 }}>
                {editingVendor ? `Edit — ${editingVendor.name}` : 'Add Subsidiary'}
              </h2>
              <button onClick={() => setShowSubModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}>
                <X size={18} />
              </button>
            </div>
            {subError && (
              <div style={{ background: T.dangerLight, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#FCA5A5', fontFamily: T.fontSans, fontSize: 13 }}>
                {subError}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Company Name *</label>
              <input value={subForm.name} onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. XYZ Enerji A.Ş." style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Risk Level</label>
              <select value={subForm.criticality_level} onChange={e => setSubForm(p => ({ ...p, criticality_level: e.target.value as CritLevel }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Industry</label>
              <input value={subForm.industry} onChange={e => setSubForm(p => ({ ...p, industry: e.target.value }))} placeholder="e.g. Financial Services" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Contact Name</label>
              <input value={subForm.contact_name} onChange={e => setSubForm(p => ({ ...p, contact_name: e.target.value }))} placeholder="Full name" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Contact Email</label>
                <input value={subForm.contact_email} onChange={e => setSubForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="email@company.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input value={subForm.contact_phone} onChange={e => setSubForm(p => ({ ...p, contact_phone: e.target.value }))} placeholder="+1 555 000 0000" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={subForm.notes} onChange={e => setSubForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSubModal(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, fontFamily: T.fontSans, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubSubmit}
                disabled={submitting || !subForm.name.trim()}
                style={{ padding: '8px 20px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting || !subForm.name.trim() ? 0.6 : 1 }}
              >
                {submitting ? 'Saving…' : editingVendor ? 'Save Changes' : 'Add Subsidiary'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ ...cardBase, border: '1px solid rgba(239,68,68,0.25)', padding: 28, width: 420, maxWidth: '90vw' }}>
            <h2 style={{ fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.text1, margin: '0 0 12px' }}>
              Remove Subsidiary
            </h2>
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, margin: '0 0 22px', lineHeight: 1.6 }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: T.text1 }}>{deleteTarget.name}</strong>{' '}
              from this group? The company record and all its assessments will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, fontFamily: T.fontSans, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '8px 16px', background: T.dangerLight, border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: T.danger, fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Removing…' : 'Remove & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excel Import Modal ──────────────────────────────────────────────── */}
      {showImport && (
        <ExcelImportModal
          groupId={id!}
          groupName={group.name}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadData(); }}
        />
      )}
    </div>
  );
}
