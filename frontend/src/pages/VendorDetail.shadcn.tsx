import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit2, Trash2, ClipboardList, Globe, Mail, User, Phone,
  Plus, X, GitCompare, ChevronRight, ChevronDown,
  MoreHorizontal, BarChart3, FileCheck, Building2,
  ArrowLeft,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { Vendor, Assessment, VendorStats } from '../types';
import { getErrorMessage } from '../api/client';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366F1','#0EA5E9','#16A34A','#D97706','#EC4899','#8B5CF6','#14B8A6','#F97316'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

function riskConfig(level: string | undefined | null) {
  switch (level) {
    case 'critical': return { bg: 'rgba(239,68,68,0.1)',  color: '#EF4444', border: 'rgba(239,68,68,0.25)',  label: 'Critical' };
    case 'high':     return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)', label: 'High'     };
    case 'medium':   return { bg: 'rgba(99,102,241,0.1)', color: '#6366F1', border: 'rgba(99,102,241,0.25)',label: 'Medium'   };
    case 'low':      return { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)',  label: 'Low'      };
    default:         return { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)', border: 'var(--border)', label: 'Unknown' };
  }
}

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  active:       { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E' },
  inactive:     { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)' },
  under_review: { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
  terminated:   { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
  completed:    { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E' },
  in_progress:  { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
  draft:        { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)' },
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

function scoreColor(s: number) { return s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444'; }

function fmtDate(ts: number | string | undefined) {
  if (!ts) return '—';
  return new Date(typeof ts === 'string' ? ts : ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function monthLabel(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 7)  return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5)  return `${w} week${w > 1 ? 's' : ''} ago`;
  return `${Math.floor(d / 30)} months ago`;
}

// ─── Edit form type ───────────────────────────────────────────────────────────
type CritLevel  = 'low' | 'medium' | 'high' | 'critical';
type VendStatus = 'active' | 'inactive' | 'under_review' | 'terminated';
interface EditForm {
  name: string; industry: string; website: string;
  contact_email: string; contact_name: string; contact_phone: string;
  notes: string; vendor_status: VendStatus; criticality_level: CritLevel;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VendorDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vendor,      setVendor]      = useState<Vendor | null>(null);
  const [stats,       setStats]       = useState<VendorStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [activeTab,       setActiveTab]       = useState<'overview' | 'assessments' | 'trend'>('overview');
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const collapsedInitRef = useRef(false);
  const [compareIds,   setCompareIds]   = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  const [showEdit,  setShowEdit]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState<EditForm>({
    name: '', industry: '', website: '', contact_email: '',
    contact_name: '', contact_phone: '', notes: '',
    vendor_status: 'active', criticality_level: 'medium',
  });

  useEffect(() => { loadData(); }, [id]);

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
    if (!id) return;
    try {
      setLoading(true);
      const [vendorData, statsData, allAssessments] = await Promise.all([
        vendorsApi.get(id),
        vendorsApi.getStats(id),
        assessmentsApi.list('vendor'),
      ]);
      setVendor(vendorData);
      setStats(statsData);
      setAssessments(allAssessments.filter(a => a.vendor_id === id));
      setEditForm({
        name:              vendorData.name,
        industry:          vendorData.industry          || '',
        website:           vendorData.website           || '',
        contact_email:     vendorData.contact_email     || '',
        contact_name:      vendorData.contact_name      || '',
        contact_phone:     vendorData.contact_phone     || '',
        notes:             vendorData.notes             || '',
        vendor_status:     (vendorData.vendor_status    || 'active')  as VendStatus,
        criticality_level: (vendorData.criticality_level || vendorData.risk_tier || 'medium') as CritLevel,
      });
      collapsedInitRef.current = false;
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !vendor) return;
    setSaving(true); setSaveError(null);
    try {
      const updated = await vendorsApi.update(id, editForm);
      setVendor({ ...vendor, ...updated });
      setShowEdit(false);
      showToast('Profile saved successfully');
      loadData();
    } catch (err) { setSaveError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    try { await vendorsApi.delete(id); navigate('/vendors'); } catch (err) { alert(getErrorMessage(err)); }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────
  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => b.created_at - a.created_at),
    [assessments]
  );

  const filteredAssessments = useMemo(() =>
    sortedAssessments.filter(a => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (dateFrom) { const f = new Date(dateFrom).getTime(); if (a.created_at < f) return false; }
      if (dateTo)   { const t = new Date(dateTo).getTime() + 86400000; if (a.created_at > t) return false; }
      return true;
    }),
    [sortedAssessments, statusFilter, dateFrom, dateTo]
  );

  const assessmentsByMonth = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, Assessment[]> = {};
    filteredAssessments.forEach(a => {
      const key = monthLabel(a.created_at);
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(a);
    });
    return order.map(k => [k, map[k]] as [string, Assessment[]]);
  }, [filteredAssessments]);

  useEffect(() => {
    if (collapsedInitRef.current || assessmentsByMonth.length === 0) return;
    collapsedInitRef.current = true;
    if (assessmentsByMonth.length > 1)
      setCollapsedMonths(new Set(assessmentsByMonth.slice(1).map(([k]) => k)));
  }, [assessmentsByMonth]);

  const trendData = useMemo(() =>
    [...assessments]
      .filter(a => a.overall_score != null)
      .sort((a, b) => a.created_at - b.created_at)
      .map(a => ({
        name:  a.name.length > 16 ? a.name.slice(0, 16) + '…' : a.name,
        date:  fmtDate(a.created_at),
        score: Math.round((a.overall_score ?? 0) * 10) / 10,
      })),
    [assessments]
  );

  const toggleMonth = (key: string) =>
    setCollapsedMonths(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8,
    background: T.surface2, border: `1px solid ${T.border}`,
    fontFamily: T.fontSans, fontSize: 13, color: T.text1, outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: T.fontSans,
    fontSize: 11, fontWeight: 600, color: T.text3,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5,
  };

  // ─── Early returns ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ height: 13, width: 140, background: T.borderLight, borderRadius: 6, marginBottom: 24 }} />
      <div style={{ ...cardBase, padding: '22px 28px', marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: T.borderLight }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 20, width: '25%', background: T.borderLight, borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 13, width: '15%', background: T.borderLight, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
  if (error || !vendor) return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ background: T.dangerLight, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#FCA5A5', fontFamily: T.fontSans, fontSize: 13 }}>
        {error || 'Vendor not found'}
      </div>
    </div>
  );

  const tier         = vendor.criticality_level ?? vendor.risk_tier ?? 'medium';
  const risk         = riskConfig(tier);
  const latestScore  = vendor.latest_assessment_score;
  const ac           = avatarColor(vendor.name);
  const vendorStatus = vendor.vendor_status ?? 'active';
  const isFiltered   = !!(statusFilter || dateFrom || dateTo);

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
        onClick={() => navigate('/vendors')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.text2, fontFamily: T.fontSans, fontSize: 13, padding: 0, marginBottom: 20,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
        onMouseLeave={e => (e.currentTarget.style.color = T.text2)}
      >
        <ArrowLeft size={14} /> Back to Vendors
      </button>

      {/* Header card */}
      <div style={{ ...cardBase, borderRadius: 14, padding: '22px 28px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          {/* Avatar + Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: `${ac}22`, border: `1px solid ${ac}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: ac }}>
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.text1, margin: 0 }}>
                {vendor.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {vendor.industry && (
                  <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2 }}>{vendor.industry}</span>
                )}
                {vendor.industry && <span style={{ color: T.text3, fontSize: 11 }}>·</span>}
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: T.fontMono,
                  padding: '3px 9px', borderRadius: 20,
                  background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {risk.label}
                </span>
                <StatusBadge status={vendorStatus} />
                {vendor.last_assessment_date && (
                  <>
                    <span style={{ color: T.text3, fontSize: 11 }}>·</span>
                    <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2 }}>
                      Last assessed {fmtDate(vendor.last_assessment_date)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setShowEdit(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: T.surface2,
                border: `1px solid ${T.border}`, borderRadius: 8,
                fontFamily: T.fontSans, fontSize: 13, color: T.text2, cursor: 'pointer',
                transition: 'color 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.text1; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.text2; }}
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={() => navigate(`/assessments/new?vendor=${id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: T.accent, border: 'none', borderRadius: 8,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
              }}
            >
              <Plus size={14} /> New Assessment
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
                  ...cardBase, padding: '4px 0', minWidth: 150, zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  <button
                    onClick={() => { setDeleteOpen(true); setShowMoreMenu(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontFamily: T.fontSans, fontSize: 13, color: T.danger, textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.dangerLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <Trash2 size={14} /> Delete Vendor
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {([
          { label: 'Total Assessments', value: stats?.totalAssessments    ?? 0,  sub: 'all time',         color: '#A5B4FC' },
          { label: 'Completed',         value: stats?.completedAssessments ?? 0, sub: 'fully completed',  color: '#22C55E' },
          { label: 'Avg Score',
            value: stats?.averageScore != null ? `${stats.averageScore.toFixed(1)}%` : '—',
            sub: stats?.averageScore != null
              ? stats.averageScore >= 70 ? 'Good compliance' : stats.averageScore >= 40 ? 'Needs improvement' : 'High risk'
              : 'No data yet',
            color: stats?.averageScore != null ? scoreColor(stats.averageScore) : T.text3 },
          { label: 'Last Assessed',
            value: vendor.last_assessment_date ? timeAgo(vendor.last_assessment_date) : '—',
            sub: vendor.last_assessment_date ? fmtDate(vendor.last_assessment_date) : 'Never assessed',
            color: T.text2 },
        ] as const).map(stat => (
          <div key={stat.label} style={{ ...cardBase, padding: '16px 18px' }}>
            <div style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 700, color: stat.color as string, lineHeight: 1 }}>
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
          { key: 'overview',    label: 'Overview',                                                                 Icon: Building2 },
          { key: 'assessments', label: `Assessments${assessments.length > 0 ? ` (${assessments.length})` : ''}`,  Icon: FileCheck },
          { key: 'trend',       label: 'Compliance Trend',                                                         Icon: BarChart3 },
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, alignItems: 'start' }}>

          {/* Contact info */}
          <div style={{ ...cardBase, padding: '22px 24px' }}>
            <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, display: 'inline-block' }} />
              Contact Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { Icon: Mail,  label: 'Email',        value: vendor.contact_email, href: vendor.contact_email ? `mailto:${vendor.contact_email}` : undefined },
                { Icon: Globe, label: 'Website',      value: vendor.website,       href: vendor.website, external: true },
                { Icon: Phone, label: 'Phone',        value: vendor.contact_phone, href: vendor.contact_phone ? `tel:${vendor.contact_phone}` : undefined },
                { Icon: User,  label: 'Contact Name', value: vendor.contact_name },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: T.surface2, border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <item.Icon size={13} style={{ color: T.text3 }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, margin: '0 0 3px' }}>
                      {item.label}
                    </p>
                    {item.value ? (
                      item.href ? (
                        <a href={item.href} target={(item as { external?: boolean }).external ? '_blank' : undefined} rel="noopener noreferrer"
                          style={{ fontFamily: T.fontSans, fontSize: 13, color: T.accent, textDecoration: 'none' }}>
                          {item.value}
                        </a>
                      ) : (
                        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text1, margin: 0 }}>{item.value}</p>
                      )
                    ) : (
                      <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text3, margin: 0 }}>Not provided</p>
                    )}
                  </div>
                </div>
              ))}
              {vendor.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, margin: '0 0 6px' }}>
                    Notes
                  </p>
                  <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, margin: 0, lineHeight: 1.6 }}>
                    {vendor.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Score card */}
          <div style={{
            ...cardBase, padding: '22px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1, margin: 0, display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
              <span style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, display: 'inline-block' }} />
              Risk Score
            </h2>
            <div style={{
              fontFamily: T.fontMono, fontSize: 54, fontWeight: 700, lineHeight: 1,
              color: latestScore != null ? scoreColor(latestScore) : T.text3,
            }}>
              {latestScore != null ? `${latestScore.toFixed(1)}%` : '—'}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: T.fontMono,
              padding: '3px 9px', borderRadius: 20,
              background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {risk.label}
            </span>
            {vendor.last_assessment_date && (
              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, margin: 0 }}>
                Last assessed {fmtDate(vendor.last_assessment_date)}
              </p>
            )}
            {latestScore == null && (
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3, margin: 0 }}>
                No completed assessments yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══ ASSESSMENTS ═══════════════════════════════════════════════════════ */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Filters + Compare bar */}
          {assessments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ ...inputStyle, width: 140, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
              >
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ ...inputStyle, width: 145, padding: '6px 10px', fontSize: 12 }} />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ ...inputStyle, width: 145, padding: '6px 10px', fontSize: 12 }} />
              {isFiltered && (
                <button
                  onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
                  style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: T.fontSans, fontSize: 12, color: T.text2, cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {compareIds.length === 2 && (
                  <button
                    onClick={() => navigate(`/vendors/${id}/compare?assessment1=${compareIds[0]}&assessment2=${compareIds[1]}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
                      background: T.accentLight, border: `1px solid rgba(99,102,241,0.3)`,
                      fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: '#A5B4FC', cursor: 'pointer',
                    }}
                  >
                    <GitCompare size={13} /> Compare Selected
                  </button>
                )}
              </div>
            </div>
          )}

          {compareIds.length > 0 && filteredAssessments.length >= 2 && (
            <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, margin: 0 }}>
              {compareIds.length}/2 selected for comparison
            </p>
          )}

          {/* Empty states */}
          {assessments.length === 0 ? (
            <div style={{ ...cardBase, padding: '48px 20px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: T.accentLight, border: `1px solid rgba(99,102,241,0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <ClipboardList size={20} style={{ color: T.accent }} />
              </div>
              <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.text1, margin: '0 0 5px' }}>No assessments yet</p>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, margin: '0 0 20px' }}>Create the first assessment for this vendor</p>
              <button
                onClick={() => navigate(`/assessments/new?vendor=${id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 8, background: T.accent, border: 'none', fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                Create First Assessment
              </button>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div style={{ ...cardBase, padding: '40px 20px', textAlign: 'center', color: T.text2, fontFamily: T.fontSans, fontSize: 13 }}>
              No assessments match the current filters.
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
                    <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.text2 }}>{month}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: T.accentLight, color: T.accent }}>
                      {monthAssessments.length} assessment{monthAssessments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>

                {!collapsed && monthAssessments.map((a, aIdx) => {
                  const aScore     = a.overall_score;
                  const isSelected = compareIds.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '0 18px',
                        borderBottom: aIdx < monthAssessments.length - 1 ? `1px solid ${T.borderLight}` : 'none',
                        background: isSelected ? T.accentLight : 'transparent',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = T.accentLight; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {filteredAssessments.length >= 2 && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setCompareIds(prev => {
                            if (prev.includes(a.id)) return prev.filter(x => x !== a.id);
                            if (prev.length >= 2) return [prev[1], a.id];
                            return [...prev, a.id];
                          })}
                          style={{ width: 15, height: 15, accentColor: T.accent, cursor: 'pointer', flexShrink: 0 }}
                        />
                      )}
                      <div
                        onClick={() => navigate(`/assessments/${a.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flex: 1, padding: '13px 0', cursor: 'pointer', gap: 16,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.text1, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3 }}>{fmtDate(a.created_at)}</span>
                            <span style={{ color: T.text3, fontSize: 10 }}>·</span>
                            <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.text3 }}>NIST CSF 2.0</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          {aScore != null && (
                            <span style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: scoreColor(aScore) }}>
                              {aScore.toFixed(1)}%
                            </span>
                          )}
                          <StatusBadge status={a.status} />
                          <ChevronRight size={14} style={{ color: T.text3 }} />
                        </div>
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
            <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, display: 'inline-block' }} />
              Compliance Score Trend
            </h2>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text2, margin: '5px 0 0' }}>
              Score progression across assessments over time
            </p>
          </div>
          {trendData.length < 2 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: T.text2, fontFamily: T.fontSans, fontSize: 13, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
              {trendData.length === 0
                ? 'No scored assessments yet. Complete an assessment to see the trend.'
                : 'At least 2 scored assessments are needed to display a trend.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="vendorScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                  </linearGradient>
                </defs>
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
                  width={40}
                />
                <Tooltip
                  contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: T.fontSans, fontSize: 12 }}
                  labelStyle={{ color: T.text1, fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number) => [`${v}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#vendorScoreGrad)"
                  dot={{ fill: '#6366F1', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#6366F1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ ...cardBase, borderRadius: 14, padding: 28, width: 560, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.text1, margin: 0 }}>Edit Profile</h2>
              <button onClick={() => { setShowEdit(false); setSaveError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}>
                <X size={18} />
              </button>
            </div>
            {saveError && (
              <div style={{ background: T.dangerLight, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#FCA5A5', fontFamily: T.fontSans, fontSize: 13 }}>
                Save failed: {saveError}
              </div>
            )}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { field: 'name',          label: 'Company Name *', type: 'text',  placeholder: '' },
                  { field: 'industry',      label: 'Industry',       type: 'text',  placeholder: 'e.g. Technology' },
                  { field: 'website',       label: 'Website',        type: 'url',   placeholder: 'https://' },
                  { field: 'contact_email', label: 'Contact Email',  type: 'email', placeholder: 'contact@company.com' },
                  { field: 'contact_name',  label: 'Contact Name',   type: 'text',  placeholder: 'Jane Smith' },
                  { field: 'contact_phone', label: 'Contact Phone',  type: 'tel',   placeholder: '+1 555 000 0000' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type={type}
                      value={(editForm as unknown as Record<string, string>)[field]}
                      onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      required={field === 'name'}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Criticality Level</label>
                  <select value={editForm.criticality_level} onChange={e => setEditForm(p => ({ ...p, criticality_level: e.target.value as CritLevel }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={editForm.vendor_status} onChange={e => setEditForm(p => ({ ...p, vendor_status: e.target.value as VendStatus }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="under_review">Under Review</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Internal notes…" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.borderLight}` }}>
                <button type="button" onClick={() => { setShowEdit(false); setSaveError(null); }}
                  style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, fontFamily: T.fontSans, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !editForm.name.trim()}
                  style={{ padding: '8px 20px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !editForm.name.trim() ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Vendor?"
        description="This will permanently delete this vendor and all associated assessments. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
