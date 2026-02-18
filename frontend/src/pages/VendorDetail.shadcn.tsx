import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, ClipboardList, Globe, Mail, User, Phone, Plus, X, GitCompare } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { Vendor, Assessment, VendorStats } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

import { T, card, sectionLabel } from '../tokens';

const cardStyle = card;

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  background: T.bg,
  border: `1px solid ${T.border}`,
  fontFamily: T.fontSans,
  fontSize: 13,
  color: T.textPrimary,
  outline: 'none',
  boxSizing: 'border-box',
};

function riskTierStyle(tier: string): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
    padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };
  if (tier === 'critical') return { ...base, background: T.dangerLight, color: T.danger, border: `1px solid ${T.dangerBorder}` };
  if (tier === 'high') return { ...base, background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` };
  if (tier === 'low') return { ...base, background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` };
  return { ...base, background: T.accentLight, color: T.accent, border: `1px solid ${T.accentBorder}` }; // medium
}

function scoreColor(score: number) {
  if (score >= 80) return T.success;
  if (score >= 50) return T.warning;
  return T.danger;
}

const avatarColors = ['#6366F1','#0EA5E9','#16A34A','#D97706','#EC4899','#8B5CF6','#14B8A6','#F97316'];
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [editForm, setEditForm] = useState({
    name: '', website: '', contact_email: '', contact_name: '', description: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    risk_tier: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [vendorData, statsData, assessmentsData] = await Promise.all([
        vendorsApi.get(id),
        vendorsApi.getStats(id),
        assessmentsApi.list('vendor'),
      ]);
      setVendor(vendorData);
      setStats(statsData);
      setAssessments(assessmentsData.filter((a) => a.vendor_id === id));
      setEditForm({
        name: vendorData.name, website: vendorData.website || '',
        contact_email: vendorData.contact_email || '', contact_name: vendorData.contact_name || '',
        description: vendorData.description || '',
        risk_level: vendorData.risk_level || 'medium',
        risk_tier: vendorData.risk_tier || 'medium',
      });
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try { await vendorsApi.update(id, editForm); setEditing(false); loadData(); } catch (err) { alert(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    if (!id) return;
    try { await vendorsApi.delete(id); navigate('/vendors'); } catch (err) { alert(getErrorMessage(err)); }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ height: 10, width: 48, background: '#E2E8F0', borderRadius: 5 }} />
          <span style={{ color: T.textMuted, fontSize: 12 }}>/</span>
          <div style={{ height: 10, width: 100, background: '#E2E8F0', borderRadius: 5 }} />
        </div>
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#E2E8F0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 22, width: 200, background: '#E2E8F0', borderRadius: 6 }} />
              <div style={{ height: 12, width: 130, background: '#E2E8F0', borderRadius: 5 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ ...cardStyle, padding: 16, height: 80 }} />)}
        </div>
        <div style={{ ...cardStyle, padding: 24, height: 180 }} />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div style={{ ...cardStyle, padding: 16, background: T.dangerLight, borderColor: T.dangerBorder }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>
          {error || 'Vendor not found'}
        </p>
      </div>
    );
  }

  const tier = vendor.risk_tier || vendor.criticality_level || 'medium';
  const latestScore = vendor.latest_assessment_score;
  const avatarColor = getAvatarColor(vendor.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link to="/vendors" style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textSecondary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
        >Vendors</Link>
        <span style={{ color: T.textMuted, fontSize: 12 }}>/</span>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>{vendor.name}</span>
      </div>

      {/* Header card */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: `${avatarColor}15`, border: `1px solid ${avatarColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, color: avatarColor }}>
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 style={{ fontFamily: T.fontSans, fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: '0 0 6px' }}>
                {vendor.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {vendor.industry && (
                  <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                    {vendor.industry}
                  </span>
                )}
                <span style={riskTierStyle(tier)}>{tier}</span>
                {vendor.last_assessment_date && (
                  <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted }}>
                    Last assessed {formatDate(vendor.last_assessment_date)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                  background: T.card, border: `1px solid ${T.border}`,
                  fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, cursor: 'pointer',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.accentBorder; el.style.color = T.accent; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.textSecondary; }}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => setDeleteOpen(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                  background: T.card, border: `1px solid ${T.border}`,
                  fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, cursor: 'pointer',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.dangerBorder; el.style.color = T.danger; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.textSecondary; }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
            <Link to={`/assessments/new?vendor=${id}`}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                background: T.accent, border: 'none',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
              }}>
                <Plus size={14} /> New Assessment
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>Edit Vendor</span>
            </div>
            <button onClick={() => setEditing(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: T.textMuted,
            }}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'name', label: 'Vendor Name *', placeholder: '', required: true },
                { key: 'website', label: 'Website', placeholder: 'https://example.com', type: 'url' },
                { key: 'contact_email', label: 'Contact Email', placeholder: 'contact@vendor.com', type: 'email' },
                { key: 'contact_name', label: 'Contact Name', placeholder: 'John Doe' },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={(editForm as any)[field.key]}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.required}
                    style={inputStyle}
                  />
                </div>
              ))}
              {[
                { key: 'risk_tier', label: 'Risk Tier', opts: [['low','Low'],['medium','Medium'],['high','High'],['critical','Critical']] },
                { key: 'risk_level', label: 'Risk Level', opts: [['low','Low Risk'],['medium','Medium Risk'],['high','High Risk']] },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <select
                    value={(editForm as any)[field.key]}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value as any })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {field.opts.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the vendor's services..."
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <button type="submit" style={{
                padding: '9px 20px', borderRadius: 8, background: T.accent, border: 'none',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
              }}>
                Save Changes
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{
                padding: '9px 20px', borderRadius: 8, background: T.card, border: `1px solid ${T.border}`,
                fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contact + Risk info (not editing) */}
      {!editing && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Contact Information */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>Contact Information</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { icon: Mail, label: 'Email', value: vendor.contact_email, href: vendor.contact_email ? `mailto:${vendor.contact_email}` : undefined },
                { icon: Globe, label: 'Website', value: vendor.website, href: vendor.website, target: '_blank' },
                { icon: Phone, label: 'Phone', value: vendor.contact_phone, href: vendor.contact_phone ? `tel:${vendor.contact_phone}` : undefined },
                { icon: User, label: 'Contact Name', value: vendor.contact_name },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: T.bg, border: `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={13} style={{ color: T.textMuted }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 4px' }}>
                        {item.label}
                      </p>
                      {item.value ? (
                        item.href ? (
                          <a href={item.href} target={(item as any).target} rel="noopener noreferrer"
                            style={{ fontFamily: T.fontSans, fontSize: 13, color: T.accent, textDecoration: 'none' }}>
                            {item.value}
                          </a>
                        ) : (
                          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary, margin: 0 }}>
                            {item.value}
                          </p>
                        )
                      ) : (
                        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, margin: 0 }}>
                          Not provided
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {vendor.description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>
                    Description
                  </p>
                  <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                    {vendor.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Score card */}
          <div style={{
            ...cardStyle, padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>Risk Score</span>
            </div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 56, fontWeight: 700, lineHeight: 1,
              color: latestScore != null ? scoreColor(latestScore) : T.textMuted,
            }}>
              {latestScore != null ? `${latestScore}%` : '—'}
            </div>
            <span style={riskTierStyle(tier)}>{tier} risk</span>
            {vendor.last_assessment_date && (
              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, margin: 0, textAlign: 'center' }}>
                Last assessed: {formatDate(vendor.last_assessment_date)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          {[
            { value: stats.totalAssessments ?? 0, label: 'Total Assessments', color: T.accent },
            { value: stats.completedAssessments ?? 0, label: 'Completed', color: T.success },
            { value: stats.inProgressAssessments ?? 0, label: 'In Progress', color: '#0EA5E9' },
            {
              value: stats.averageScore != null ? `${stats.averageScore.toFixed(1)}%` : '—',
              label: 'Avg Score',
              color: stats.averageScore != null ? scoreColor(stats.averageScore) : T.textMuted,
            },
          ].map((stat) => (
            <div key={stat.label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Trend Mini Chart */}
      {assessments.length >= 2 && (
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
            <span style={sectionLabel}>Score Trend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {assessments.slice(-5).map((a) => {
              const s = a.overall_score ?? 0;
              const barH = Math.max(4, (s / 100) * 72);
              const color = s >= 80 ? T.success : s >= 50 ? T.warning : T.danger;
              return (
                <div key={a.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted }}>
                    {a.overall_score != null ? `${Math.round(a.overall_score)}%` : '—'}
                  </span>
                  <div style={{
                    width: '100%', maxWidth: 48, height: barH, borderRadius: 4,
                    background: color, opacity: 0.8, transition: 'height 0.3s',
                  }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 9, color: T.textMuted, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 60 }}>
                    {a.name.length > 10 ? a.name.slice(0, 10) + '...' : a.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
            <span style={sectionLabel}>Assessment History</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {compareIds.length === 2 && (
              <button
                onClick={() => navigate(`/vendors/${id}/compare?assessment1=${compareIds[0]}&assessment2=${compareIds[1]}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                  background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.accent, cursor: 'pointer',
                }}
              >
                <GitCompare size={12} /> Compare Selected
              </button>
            )}
            <Link to={`/assessments/new?vendor=${id}`} style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                background: T.card, border: `1px solid ${T.border}`,
                fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, cursor: 'pointer',
              }}>
                <ClipboardList size={12} /> New Assessment
              </button>
            </Link>
          </div>
        </div>

        {assessments.length >= 2 && (
          <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, marginBottom: 12 }}>
            Select 2 assessments to compare ({compareIds.length}/2 selected)
          </p>
        )}

        {assessments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: T.accentLight,
              border: `1px solid ${T.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <ClipboardList size={20} style={{ color: T.accent }} />
            </div>
            <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: '0 0 4px' }}>
              No assessments yet
            </p>
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '0 0 20px' }}>
              Create the first assessment for this vendor
            </p>
            <Link to={`/assessments/new?vendor=${id}`} style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 8,
                background: T.accent, border: 'none',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
              }}>
                Create First Assessment
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assessments.map((assessment) => {
              const aScore = assessment.overall_score;
              const isSelected = compareIds.includes(assessment.id);
              return (
                <div key={assessment.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {assessments.length >= 2 && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setCompareIds(prev => {
                          if (prev.includes(assessment.id)) return prev.filter(x => x !== assessment.id);
                          if (prev.length >= 2) return [prev[1], assessment.id];
                          return [...prev, assessment.id];
                        });
                      }}
                      style={{ width: 16, height: 16, accentColor: '#6366F1', cursor: 'pointer', flexShrink: 0 }}
                    />
                  )}
                  <Link to={`/assessments/${assessment.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 16, padding: '14px 16px', borderRadius: 10,
                      background: isSelected ? T.accentLight : T.bg,
                      border: `1px solid ${isSelected ? T.accentBorder : T.border}`,
                      transition: 'all 0.14s',
                    }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = T.accentBorder;
                        el.style.background = T.accentLight;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        if (!isSelected) {
                          el.style.borderColor = T.border;
                          el.style.background = T.bg;
                        }
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {assessment.name}
                        </h3>
                        {assessment.description && (
                          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {assessment.description}
                          </p>
                        )}
                        <p style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted, margin: 0 }}>
                          Started {formatDate(assessment.created_at)}
                          {assessment.completed_at && ` · Completed ${formatDate(assessment.completed_at)}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{
                          fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          ...(assessment.status === 'completed'
                            ? { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` }
                            : assessment.status === 'in_progress'
                            ? { background: T.accentLight, color: T.accent, border: `1px solid ${T.accentBorder}` }
                            : { background: '#F1F5F9', color: T.textSecondary, border: `1px solid ${T.border}` }),
                        }}>
                          {assessment.status === 'in_progress' ? 'In Progress' : assessment.status}
                        </span>
                        {aScore != null && (
                          <span style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: scoreColor(aScore) }}>
                            {aScore.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
