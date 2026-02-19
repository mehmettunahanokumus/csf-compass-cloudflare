import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, ArrowLeft, Upload, RefreshCw, Plus,
  Pencil, Trash2, X, ChevronRight,
} from 'lucide-react';
import { companyGroupsApi } from '../api/company-groups';
import { vendorsApi } from '../api/vendors';
import type { GroupSummary, Vendor } from '../types';
import ExcelImportModal from '../components/import/ExcelImportModal';

const CRITICALITY_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  high:     { bg: 'rgba(251,146,60,0.15)', color: '#FB923C' },
  medium:   { bg: 'rgba(251,191,36,0.15)', color: '#FBBF24' },
  low:      { bg: 'rgba(52,211,153,0.15)', color: '#34D399' },
};

function CriticalityBadge({ level }: { level?: string }) {
  const style = CRITICALITY_COLORS[level || 'medium'] || CRITICALITY_COLORS.medium;
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      background: style.bg, color: style.color,
      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
      display: 'inline-block',
    }}>
      {level || 'medium'}
    </span>
  );
}

function ScoreCell({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>—</span>;
  }
  const color = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color }}>
      {score}%
    </span>
  );
}

type CritLevel = 'low' | 'medium' | 'high' | 'critical';

interface SubForm {
  name: string;
  notes: string;
  criticality_level: CritLevel;
  industry: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

const EMPTY_FORM: SubForm = {
  name: '', notes: '', criticality_level: 'medium',
  industry: '', contact_name: '', contact_email: '', contact_phone: '',
};

export default function CompanyGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add/Edit modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [subForm, setSubForm] = useState<SubForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) loadSummary();
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await companyGroupsApi.getSummary(id!);
      setSummary(res.data);
    } catch {
      setError('Failed to load group summary');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVendor(null);
    setSubForm(EMPTY_FORM);
    setSubError(null);
    setShowSubModal(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setSubForm({
      name: vendor.name,
      notes: vendor.notes || '',
      criticality_level: ((vendor.criticality_level || vendor.risk_tier || 'medium') as CritLevel),
      industry: vendor.industry || '',
      contact_name: vendor.contact_name || '',
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
    });
    setSubError(null);
    setShowSubModal(true);
  };

  const handleSubSubmit = async () => {
    if (!subForm.name.trim()) return;
    setSubmitting(true);
    setSubError(null);
    try {
      if (editingVendor) {
        await vendorsApi.update(editingVendor.id, {
          name: subForm.name,
          notes: subForm.notes || undefined,
          criticality_level: subForm.criticality_level,
          industry: subForm.industry || undefined,
          contact_name: subForm.contact_name || undefined,
          contact_email: subForm.contact_email || undefined,
          contact_phone: subForm.contact_phone || undefined,
        });
        showToast(`${subForm.name} updated successfully`);
      } else {
        await vendorsApi.create({
          name: subForm.name,
          notes: subForm.notes || undefined,
          criticality_level: subForm.criticality_level,
          industry: subForm.industry || undefined,
          contact_name: subForm.contact_name || undefined,
          contact_email: subForm.contact_email || undefined,
          contact_phone: subForm.contact_phone || undefined,
          group_id: id!,
        });
        showToast(`${subForm.name} added to group`);
      }
      setShowSubModal(false);
      loadSummary();
    } catch {
      setSubError(editingVendor ? 'Failed to update subsidiary' : 'Failed to add subsidiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vendorsApi.delete(deleteTarget.id);
      const name = deleteTarget.name;
      setDeleteTarget(null);
      showToast(`${name} removed from group`);
      loadSummary();
    } catch {
      // keep dialog open on error
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', textAlign: 'center', color: 'var(--text-2)', fontFamily: 'Manrope, sans-serif' }}>
        Loading group...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          {error || 'Group not found'}
        </div>
      </div>
    );
  }

  const { group, csf_functions, vendors: vendorSummaries } = summary;
  const vendorsWithAssessments = vendorSummaries.filter(v => v.latest_assessment !== null);
  const avgScore = vendorsWithAssessments.length > 0
    ? Math.round(vendorsWithAssessments.reduce((sum, v) => sum + (v.overall_score ?? 0), 0) / vendorsWithAssessments.length)
    : null;

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px',
    fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#F8FAFC',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block', fontFamily: 'Manrope, sans-serif',
    fontSize: 12, fontWeight: 600 as const,
    color: '#94A3B8', marginBottom: 5,
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

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
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/company-groups')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'Manrope, sans-serif', fontSize: 13, padding: 0, marginBottom: 16 }}
        >
          <ArrowLeft size={14} />
          Back to Group Companies
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: '#818CF8' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {group.name}
              </h1>
              {group.description && (
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
                  {group.description}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            <button
              onClick={openAddModal}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} />
              Add Subsidiary
            </button>
            <button
              onClick={() => setShowImport(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              <Upload size={14} />
              Import Excel
            </button>
            <button
              onClick={loadSummary}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Companies', value: vendorSummaries.length.toString(), color: '#A5B4FC' },
          { label: 'Assessed', value: vendorsWithAssessments.length.toString(), color: '#34D399' },
          { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', color: avgScore !== null ? (avgScore >= 70 ? '#34D399' : avgScore >= 40 ? '#FBBF24' : '#F87171') : 'var(--text-3)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px', flex: 1 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'var(--text-2)', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Subsidiary Companies Management Table ─── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#CBD5E1', margin: 0 }}>
            Subsidiary Companies
          </h2>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'var(--text-2)' }}>
            {vendorSummaries.length} {vendorSummaries.length === 1 ? 'company' : 'companies'}
          </span>
        </div>

        {vendorSummaries.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-2)', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
            No subsidiaries yet. Click <strong style={{ color: '#A5B4FC' }}>Add Subsidiary</strong> to add the first company.
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 160px 90px 88px',
              padding: '8px 20px', borderBottom: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {['Company', 'Risk Level', 'Industry', 'Score', 'Actions'].map(h => (
                <div key={h} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  {h}
                </div>
              ))}
            </div>

            {vendorSummaries.map((vs, idx) => (
              <div
                key={vs.vendor.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 160px 90px 88px',
                  padding: '12px 20px',
                  borderBottom: idx < vendorSummaries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                {/* Company name — clickable */}
                <div
                  onClick={() => navigate(`/vendors/${vs.vendor.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {vs.vendor.name}
                    <ChevronRight size={12} style={{ color: 'var(--text-3)' }} />
                  </div>
                  {vs.latest_assessment && (
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {vs.latest_assessment.name}
                    </div>
                  )}
                </div>

                {/* Risk Level badge */}
                <div>
                  <CriticalityBadge level={vs.vendor.criticality_level || vs.vendor.risk_tier} />
                </div>

                {/* Industry */}
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'var(--text-2)' }}>
                  {vs.vendor.industry || '—'}
                </div>

                {/* Score */}
                <div>
                  <ScoreCell score={vs.overall_score} />
                </div>

                {/* Edit + Delete */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => openEditModal(vs.vendor)}
                    title="Edit subsidiary"
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#94A3B8',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(vs.vendor)}
                    title="Remove subsidiary"
                    style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#F87171',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── CSF Function Scores Comparison Table ─── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#CBD5E1', margin: 0 }}>
            CSF Function Scores by Company
          </h2>
        </div>

        {vendorSummaries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
            No companies in this group yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', minWidth: 160 }}>
                    Company
                  </th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                    Overall
                  </th>
                  {csf_functions.map(fn => (
                    <th key={fn.id} style={{ textAlign: 'center', padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', minWidth: 90 }}>
                      {fn.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendorSummaries.map((vs, idx) => (
                  <tr
                    key={vs.vendor.id}
                    style={{ borderBottom: idx < vendorSummaries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                        {vs.vendor.name}
                      </div>
                      {vs.latest_assessment && (
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          {vs.latest_assessment.name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <ScoreCell score={vs.overall_score} />
                    </td>
                    {csf_functions.map(fn => (
                      <td key={fn.id} style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <ScoreCell score={vs.function_scores[fn.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Add / Edit Subsidiary Modal ─── */}
      {showSubModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: 28, width: 480, maxWidth: '92vw',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                {editingVendor ? `Edit — ${editingVendor.name}` : 'Add Subsidiary'}
              </h2>
              <button onClick={() => setShowSubModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            {subError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
                {subError}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Company Name *</label>
              <input
                value={subForm.name}
                onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. XYZ Enerji A.Ş."
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Risk Level</label>
              <select
                value={subForm.criticality_level}
                onChange={e => setSubForm(p => ({ ...p, criticality_level: e.target.value as CritLevel }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Industry</label>
              <input
                value={subForm.industry}
                onChange={e => setSubForm(p => ({ ...p, industry: e.target.value }))}
                placeholder="e.g. Financial Services"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Contact Name</label>
              <input
                value={subForm.contact_name}
                onChange={e => setSubForm(p => ({ ...p, contact_name: e.target.value }))}
                placeholder="Full name"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Contact Email</label>
                <input
                  value={subForm.contact_email}
                  onChange={e => setSubForm(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder="email@company.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input
                  value={subForm.contact_phone}
                  onChange={e => setSubForm(p => ({ ...p, contact_phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={subForm.notes}
                onChange={e => setSubForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSubModal(false)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubSubmit}
                disabled={submitting || !subForm.name.trim()}
                style={{ padding: '8px 20px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting || !subForm.name.trim() ? 0.6 : 1 }}
              >
                {submitting ? 'Saving...' : (editingVendor ? 'Save Changes' : 'Add Subsidiary')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw',
          }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>
              Remove Subsidiary
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', margin: '0 0 22px', lineHeight: 1.6 }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: '#F8FAFC' }}>{deleteTarget.name}</strong>{' '}
              from this group? The company record and all its assessments will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#F87171', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Removing...' : 'Remove & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImport && (
        <ExcelImportModal
          groupId={id!}
          groupName={group.name}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadSummary(); }}
        />
      )}
    </div>
  );
}
