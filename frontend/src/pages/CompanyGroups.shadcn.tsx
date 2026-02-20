import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, X, Pencil, Trash2, MoreHorizontal, Search, Users } from 'lucide-react';
import { companyGroupsApi } from '../api/company-groups';
import type { CompanyGroup } from '../types';

const ORG_ID = 'demo-org-123';

const T = {
  card: 'var(--card)',
  border: 'var(--border)',
  borderLight: 'rgba(148,163,184,0.12)',
  bg: 'var(--bg)',
  surface2: 'var(--surface-2)',
  text1: 'var(--text-1)',
  text2: 'var(--text-2)',
  text3: 'var(--text-3)',
  accent: 'var(--accent)',
  accentLight: 'rgba(99,102,241,0.08)',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  fontSans: 'var(--font-sans)',
  fontMono: 'var(--font-mono)',
} as const;

const cardBase = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
} as const;

function riskConfig(level: string | undefined | null) {
  switch (level) {
    case 'critical': return { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.25)',   label: 'Critical' };
    case 'high':     return { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', border: 'rgba(245,158,11,0.25)',  label: 'High'     };
    case 'medium':   return { bg: 'rgba(99,102,241,0.1)',  color: '#6366F1', border: 'rgba(99,102,241,0.25)', label: 'Medium'   };
    case 'low':      return { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', border: 'rgba(34,197,94,0.25)',   label: 'Low'      };
    default:         return { bg: 'rgba(148,163,184,0.1)', color: 'var(--text-3)', border: 'var(--border)', label: 'None' };
  }
}

const AVATAR_COLORS = ['#6366F1','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#3B82F6','#10B981','#F97316'];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface EditForm {
  name: string;
  description: string;
  industry: string;
  risk_level: RiskLevel;
  primary_contact: string;
}

const EMPTY_EDIT: EditForm = { name: '', description: '', industry: '', risk_level: 'medium', primary_contact: '' };

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

function RowSkeleton() {
  const shimmer = { background: T.borderLight, borderRadius: 6 } as const;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: `1px solid ${T.borderLight}` }}>
      <div style={{ width: 38, height: 38, flexShrink: 0, ...shimmer, borderRadius: 9 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ height: 13, width: '38%', ...shimmer }} />
        <div style={{ height: 11, width: '18%', ...shimmer }} />
      </div>
      <div style={{ width: 76, height: 22, flexShrink: 0, ...shimmer, borderRadius: 20 }} />
      <div style={{ width: 95, height: 13, flexShrink: 0, ...shimmer }} />
      <div style={{ width: 115, height: 13, flexShrink: 0, ...shimmer }} />
      <div style={{ width: 28, height: 28, flexShrink: 0, ...shimmer }} />
    </div>
  );
}

function GroupRow({ group, onEdit, onDelete }: {
  group: CompanyGroup;
  onEdit: (g: CompanyGroup) => void;
  onDelete: (g: CompanyGroup) => void;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const risk = riskConfig(group.risk_level);
  const color = avatarColor(group.name);

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
      onClick={() => navigate(`/company-groups/${group.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        borderBottom: `1px solid ${T.borderLight}`,
        background: hovered ? T.accentLight : 'transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color }}>
          {group.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name + industry */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.text1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {group.name}
        </div>
        {(group.industry || group.description) && (
          <div style={{
            fontFamily: T.fontSans, fontSize: 12, color: T.text3, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {group.industry || group.description}
          </div>
        )}
      </div>

      {/* Risk badge */}
      <div style={{ flexShrink: 0, width: 90 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: 11, fontWeight: 700, fontFamily: T.fontMono,
          padding: '3px 9px', borderRadius: 20,
          background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {risk.label}
        </span>
      </div>

      {/* Companies count */}
      <div style={{ flexShrink: 0, width: 110, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Users size={13} style={{ color: T.text3, flexShrink: 0 }} />
        <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2 }}>
          {group.vendor_count ?? 0} {(group.vendor_count ?? 0) === 1 ? 'company' : 'companies'}
        </span>
      </div>

      {/* Primary contact */}
      <div style={{ flexShrink: 0, width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3 }}>
          {group.primary_contact || '—'}
        </span>
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
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 32, zIndex: 30,
            ...cardBase, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            minWidth: 160, overflow: 'hidden',
          }}>
            <button
              onClick={() => { setMenuOpen(false); onEdit(group); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px', border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: T.fontSans, fontSize: 13, color: T.text1,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.accentLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Pencil size={14} style={{ color: T.text3 }} /> Edit Group
            </button>
            <div style={{ height: 1, background: T.borderLight, margin: '2px 0' }} />
            <button
              onClick={() => { setMenuOpen(false); onDelete(group); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '9px 14px', border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                fontFamily: T.fontSans, fontSize: 13, color: T.danger,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = T.dangerLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={14} style={{ color: T.danger }} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyGroups() {
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', industry: '' });

  // Edit modal
  const [editTarget, setEditTarget] = useState<CompanyGroup | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [editing, setEditing] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<CompanyGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadGroups(); }, []);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await companyGroupsApi.list(ORG_ID);
      setGroups(res.data);
    } catch {
      setError('Failed to load group companies');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = groups.length;
    const totalSubs = groups.reduce((s, g) => s + (g.vendor_count ?? 0), 0);
    const highRisk = groups.filter(g => g.risk_level === 'high' || g.risk_level === 'critical').length;
    const withContact = groups.filter(g => !!g.primary_contact).length;
    return { total, totalSubs, highRisk, withContact };
  }, [groups]);

  // Filtered
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.industry || '').toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      (g.primary_contact || '').toLowerCase().includes(q),
    );
  }, [groups, search]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    try {
      setCreating(true);
      await companyGroupsApi.create({
        organization_id: ORG_ID,
        name: createForm.name,
        description: createForm.description || undefined,
        industry: createForm.industry || undefined,
      });
      setCreateForm({ name: '', description: '', industry: '' });
      setShowCreate(false);
      loadGroups();
    } catch {
      setError('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (group: CompanyGroup) => {
    setEditTarget(group);
    setEditForm({
      name: group.name,
      description: group.description || '',
      industry: group.industry || '',
      risk_level: (group.risk_level as RiskLevel) || 'medium',
      primary_contact: group.primary_contact || '',
    });
  };

  const handleUpdate = async () => {
    if (!editTarget || !editForm.name.trim()) return;
    setEditing(true);
    try {
      await companyGroupsApi.update(editTarget.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        industry: editForm.industry || undefined,
        risk_level: editForm.risk_level,
        primary_contact: editForm.primary_contact || undefined,
      } as Partial<CompanyGroup>);
      showToast(`${editForm.name} updated`);
      setEditTarget(null);
      loadGroups();
    } catch {
      // silent
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const name = deleteTarget.name;
      await companyGroupsApi.delete(deleteTarget.id);
      showToast(`${name} deleted`);
      setDeleteTarget(null);
      loadGroups();
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '8px 12px',
    fontFamily: T.fontSans, fontSize: 13, color: T.text1,
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: T.fontSans,
    fontSize: 11, fontWeight: 600, color: T.text3,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 6,
  };

  const statCards = [
    { label: 'Total Groups',      value: stats.total,      sub: 'group entities',      color: '#6366F1' },
    { label: 'Total Subsidiaries',value: stats.totalSubs,  sub: 'across all groups',   color: '#8B5CF6' },
    { label: 'High/Critical Risk',value: stats.highRisk,   sub: 'require attention',   color: '#EF4444' },
    { label: 'With Contact',      value: stats.withContact,sub: 'primary contacts set', color: '#10B981' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          ...cardBase,
          border: '1px solid rgba(52,211,153,0.4)',
          padding: '10px 18px',
          fontFamily: T.fontSans, fontSize: 13, color: '#34D399',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.text1, margin: 0 }}>
            Group Companies
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, marginTop: 4, marginBottom: 0 }}>
            Internal subsidiaries and group entities under your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.accent, color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={15} /> New Group
        </button>
      </div>

      {error && (
        <div style={{
          background: T.dangerLight, border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          color: '#FCA5A5', fontFamily: T.fontSans, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ ...cardBase, padding: '16px 18px' }}>
            <div style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {loading ? '—' : s.value}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.text2, marginTop: 4 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.text3, marginTop: 2 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: T.text3, pointerEvents: 'none',
        }} />
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, industry, or contact…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '9px 36px',
            fontFamily: T.fontSans, fontSize: 13, color: T.text1,
            outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: T.text3, display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ ...cardBase, overflow: 'hidden' }}>
        {/* Column header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '10px 18px',
          background: T.surface2,
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ flexShrink: 0, width: 38 }} />
          <ColLabel style={{ flex: 1 }}>Group</ColLabel>
          <ColLabel style={{ flexShrink: 0, width: 90 }}>Risk Level</ColLabel>
          <ColLabel style={{ flexShrink: 0, width: 110 }}>Subsidiaries</ColLabel>
          <ColLabel style={{ flexShrink: 0, width: 140 }}>Primary Contact</ColLabel>
          <div style={{ flexShrink: 0, width: 28 }} />
        </div>

        {/* Rows */}
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => <RowSkeleton key={i} />)}
          </>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Building2 size={36} style={{ color: T.text3, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.text2, margin: '0 0 6px' }}>
              {search ? 'No groups match your search' : 'No group companies yet'}
            </p>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3, margin: 0 }}>
              {search ? 'Try a different search term' : 'Add your first subsidiary to get started'}
            </p>
          </div>
        ) : (
          filtered.map(group => (
            <GroupRow
              key={group.id}
              group={group}
              onEdit={openEdit}
              onDelete={g => setDeleteTarget(g)}
            />
          ))
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '10px 18px',
            background: T.surface2,
            borderTop: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3 }}>
              {search
                ? `Showing ${filtered.length} of ${groups.length} groups`
                : `${groups.length} group ${groups.length === 1 ? 'entity' : 'entities'}`}
            </span>
            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.text3 }}>
              {stats.totalSubs} total subsidiaries
            </span>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ ...cardBase, padding: 28, width: 440, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.text1, margin: 0 }}>New Group</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}>
                <X size={18} />
              </button>
            </div>
            {(['name', 'description', 'industry'] as const).map(field => (
              <div key={field} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{field}{field === 'name' && ' *'}</label>
                <input
                  value={createForm[field]}
                  onChange={e => setCreateForm(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={field === 'name' ? 'e.g. XYZ Holding' : field === 'industry' ? 'e.g. Financial Services' : 'Optional description'}
                  style={inputStyle}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, fontFamily: T.fontSans, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createForm.name.trim()}
                style={{ padding: '8px 16px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: creating || !createForm.name.trim() ? 0.6 : 1 }}
              >
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ ...cardBase, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.text1, margin: 0 }}>
                Edit Group
              </h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Group Name *</label>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. XYZ Holding" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Risk Level</label>
              <select value={editForm.risk_level} onChange={e => setEditForm(p => ({ ...p, risk_level: e.target.value as RiskLevel }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Industry</label>
              <input value={editForm.industry} onChange={e => setEditForm(p => ({ ...p, industry: e.target.value }))} placeholder="e.g. Financial Services" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Primary Contact</label>
              <input value={editForm.primary_contact} onChange={e => setEditForm(p => ({ ...p, primary_contact: e.target.value }))} placeholder="e.g. Jane Smith, CTO" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditTarget(null)}
                style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, fontFamily: T.fontSans, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editing || !editForm.name.trim()}
                style={{ padding: '8px 20px', background: T.accent, border: 'none', borderRadius: 8, color: '#fff', fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: editing || !editForm.name.trim() ? 0.6 : 1 }}
              >
                {editing ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ ...cardBase, border: '1px solid rgba(239,68,68,0.25)', padding: 28, width: 420, maxWidth: '90vw' }}>
            <h2 style={{ fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.text1, margin: '0 0 12px' }}>
              Delete {deleteTarget.name}?
            </h2>
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.text2, margin: '0 0 22px', lineHeight: 1.6 }}>
              This will remove the group. Subsidiary companies will remain but will no longer be linked to this group. This action cannot be undone.
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
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
