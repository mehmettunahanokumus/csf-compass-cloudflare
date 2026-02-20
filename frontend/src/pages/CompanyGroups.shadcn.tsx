import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Users, ChevronRight, X, Pencil, Trash2 } from 'lucide-react';
import { companyGroupsApi } from '../api/company-groups';
import type { CompanyGroup } from '../types';

const ORG_ID = 'demo-org-123';

const RISK_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)', color: '#F87171' },
  high:     { bg: 'rgba(251,146,60,0.12)', color: '#FB923C' },
  medium:   { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
  low:      { bg: 'rgba(52,211,153,0.12)', color: '#34D399' },
};

function RiskBadge({ level }: { level?: string }) {
  const s = RISK_COLORS[level || 'medium'] || RISK_COLORS.medium;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
      padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
      display: 'inline-block', lineHeight: 1.6,
    }}>
      {level || 'medium'}
    </span>
  );
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface EditForm {
  name: string;
  description: string;
  industry: string;
  risk_level: RiskLevel;
  primary_contact: string;
}

const EMPTY_EDIT: EditForm = { name: '', description: '', industry: '', risk_level: 'medium', primary_contact: '' };

export default function CompanyGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
      setError('Failed to load company groups');
    } finally {
      setLoading(false);
    }
  };

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

  const openEdit = (e: React.MouseEvent, group: CompanyGroup) => {
    e.stopPropagation();
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

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px',
    fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#F8FAFC',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block', fontFamily: 'Manrope, sans-serif',
    fontSize: 12, fontWeight: 600 as const, color: '#94A3B8', marginBottom: 6,
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          background: '#1E293B', border: '1px solid rgba(52,211,153,0.4)',
          borderRadius: 10, padding: '10px 18px',
          fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#34D399',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            Group Companies
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Internal subsidiaries and group entities under your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#6366F1', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={15} /> New Group
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-2)', fontFamily: 'Manrope, sans-serif' }}>
          Loading groups...
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
          <Building2 size={40} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            No group companies yet. Add your first subsidiary to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {groups.map(group => {
            const isHovered = hoveredId === group.id;
            return (
              <div
                key={group.id}
                onClick={() => navigate(`/company-groups/${group.id}`)}
                onMouseEnter={() => setHoveredId(group.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: isHovered ? 'rgba(99,102,241,0.06)' : 'var(--card)',
                  border: `1px solid ${isHovered ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                  borderRadius: 12, padding: 20, cursor: 'pointer',
                  boxShadow: isHovered ? '0 4px 16px rgba(99,102,241,0.15)' : 'var(--shadow-xs)',
                  transition: 'border-color 0.14s, background 0.14s, box-shadow 0.14s',
                  position: 'relative',
                }}
              >
                {/* Top row: icon + name / action buttons */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Building2 size={18} style={{ color: '#818CF8' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {group.name}
                      </div>
                      {group.industry && (
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                          {group.industry}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover: edit + delete buttons / Default: chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    {isHovered ? (
                      <>
                        <button
                          onClick={(e) => openEdit(e, group)}
                          title="Edit group"
                          style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6, padding: '5px 6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', color: '#475569',
                            transition: 'color 0.12s, background 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(group); }}
                          title="Delete group"
                          style={{
                            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: 6, padding: '5px 6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', color: '#475569',
                            transition: 'color 0.12s, background 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <ChevronRight size={16} style={{ color: 'var(--text-3)', marginTop: 2 }} />
                    )}
                  </div>
                </div>

                {group.description && (
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'var(--text-2)', marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
                    {group.description}
                  </p>
                )}

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', flexWrap: 'wrap' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={13} style={{ color: 'var(--text-2)' }} />
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'var(--text-2)' }}>
                      {group.vendor_count ?? 0} {(group.vendor_count ?? 0) === 1 ? 'company' : 'companies'}
                    </span>
                  </div>
                  <RiskBadge level={group.risk_level} />
                  {group.primary_contact && (
                    <span style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'var(--text-2)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {group.primary_contact}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 28, width: 440, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>New Group</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
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
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !createForm.name.trim()} style={{ padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: creating || !createForm.name.trim() ? 0.6 : 1 }}>
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Edit Group
              </h2>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Group Name *</label>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. XYZ Holding" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
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
              <button onClick={() => setEditTarget(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleUpdate} disabled={editing || !editForm.name.trim()} style={{ padding: '8px 20px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: editing || !editForm.name.trim() ? 0.6 : 1 }}>
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              Delete {deleteTarget.name}?
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', margin: '0 0 22px', lineHeight: 1.6 }}>
              This will remove the group. Subsidiary companies will remain but will no longer be linked to this group. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#F87171', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
