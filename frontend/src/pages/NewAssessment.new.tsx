import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Building2, Package, ShieldCheck, Check, Search, X,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import { T, card, inputStyle } from '../tokens';

// ── Types ──────────────────────────────────────────────────────────────────
type EntityType = 'group_company' | 'vendor' | 'self';

interface FormData {
  entityType: EntityType;
  vendorId: string;
  name: string;
  description: string;
}

// ── Risk Badge ─────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const cfg: Record<string, { bg: string; color: string }> = {
    critical: { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
    high:     { bg: 'rgba(249,115,22,0.12)', color: '#F97316' },
    medium:   { bg: 'rgba(234,179,8,0.12)',  color: '#EAB308' },
    low:      { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E' },
  };
  const c = cfg[level];
  if (!c) return null;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20,
      fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      background: c.bg, color: c.color,
      flexShrink: 0,
    }}>
      {level}
    </span>
  );
}

// ── Step 1 card config ─────────────────────────────────────────────────────
const STEP1_OPTIONS = [
  {
    entityType: 'group_company' as EntityType,
    icon: <Building2 size={40} />,
    color: '#3B82F6',
    colorLight: 'rgba(59,130,246,0.08)',
    title: 'Group Company',
    desc: 'Assess an internal subsidiary or group entity',
  },
  {
    entityType: 'vendor' as EntityType,
    icon: <Package size={40} />,
    color: '#8B5CF6',
    colorLight: 'rgba(139,92,246,0.08)',
    title: 'Vendor',
    desc: 'Assess an external third-party vendor or supplier',
  },
  {
    entityType: 'self' as EntityType,
    icon: <ShieldCheck size={40} />,
    color: '#6366F1',
    colorLight: 'rgba(99,102,241,0.08)',
    title: 'Self-Assessment',
    desc: "Assess your own organization's cybersecurity posture",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────
export default function NewAssessmentNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [extVendors, setExtVendors]   = useState<Vendor[]>([]);  // external only
  const [allVendors, setAllVendors]   = useState<Vendor[]>([]);  // all (for subsidiaries)
  const [loading,          setLoading]         = useState(false);
  const [loadingEntities,  setLoadingEntities]  = useState(false);
  const [searchQ,          setSearchQ]          = useState('');
  const [errorMsg,         setErrorMsg]         = useState('');

  const [formData, setFormData] = useState<FormData>({
    entityType: 'vendor',
    vendorId:   '',
    name:       '',
    description: '',
  });

  // Load entity lists once on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingEntities(true);
      try {
        const [ext, all] = await Promise.all([
          vendorsApi.list(),    // exclude_grouped=true
          vendorsApi.listAll(), // all vendors, no filter
        ]);
        if (!cancelled) {
          setExtVendors(ext);
          setAllVendors(all);
        }
      } catch { /* silently ignore */ }
      finally { if (!cancelled) setLoadingEntities(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Derive subsidiaries from allVendors
  const subsidiaries = useMemo(
    () => allVendors.filter(v => !!v.group_id),
    [allVendors],
  );

  // Active entity list depending on selected type
  const currentEntities = formData.entityType === 'group_company' ? subsidiaries : extVendors;

  // Filtered by search
  const filteredEntities = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return currentEntities;
    return currentEntities.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.industry?.toLowerCase().includes(q) ?? false),
    );
  }, [currentEntities, searchQ]);

  // Step 1: type card clicked
  const handleTypeSelect = (entityType: EntityType) => {
    setFormData(f => ({ ...f, entityType, vendorId: '' }));
    setSearchQ('');
    setStep(entityType === 'self' ? 3 : 2);
  };

  // Final submit
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.name.trim()) return;
    setErrorMsg('');
    try {
      setLoading(true);
      const assessment = await assessmentsApi.create({
        assessment_type: formData.entityType === 'self' ? 'organization' : 'vendor',
        vendor_id: formData.entityType !== 'self' ? formData.vendorId : undefined,
        name: formData.name,
        description: formData.description || undefined,
      });
      navigate(`/assessments/${assessment.id}`);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Display step (for self: step 3 maps to display step 2)
  const isSelf = formData.entityType === 'self';
  const displayStep = isSelf && step === 3 ? 2 : step;
  const totalSteps  = isSelf ? 2 : 3;
  const stepLabels  = isSelf
    ? ['Assessment Type', 'Assessment Details']
    : ['Assessment Type', 'Select Company', 'Assessment Details'];

  const selectedEntity = currentEntities.find(v => v.id === formData.vendorId);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/assessments" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 9,
              background: T.card, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textMuted, cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#CBD5E1'; el.style.color = T.textPrimary; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = T.border; el.style.color = T.textMuted; }}
          >
            <ArrowLeft size={16} />
          </div>
        </Link>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Create New Assessment
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 2, margin: '2px 0 0' }}>
            Step <span style={{ fontFamily: T.fontMono }}>{displayStep}</span> of{' '}
            <span style={{ fontFamily: T.fontMono }}>{totalSteps}</span>
            {' '}— {stepLabels[displayStep - 1]}
          </p>
        </div>
      </div>

      {/* ── Progress Stepper ──────────────────────────────────────────── */}
      <div style={{ ...card, padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, idx, arr) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: idx < arr.length - 1 ? 1 : 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s <= displayStep ? T.accent : 'transparent',
                color: s <= displayStep ? '#fff' : T.textFaint,
                border: `2px solid ${s <= displayStep ? T.accent : T.border}`,
                transition: 'all 0.25s',
              }}>
                {s < displayStep
                  ? <Check size={13} />
                  : <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{s}</span>
                }
              </div>
              {idx < arr.length - 1 && (
                <div style={{
                  flex: 1, height: 2, borderRadius: 2, margin: '0 8px',
                  background: s < displayStep ? T.accent : T.border,
                  transition: 'background 0.25s',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Assessment Type ─────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {STEP1_OPTIONS.map(opt => (
            <button
              key={opt.entityType}
              onClick={() => handleTypeSelect(opt.entityType)}
              style={{
                ...card,
                padding: '32px 20px 28px',
                textAlign: 'center', cursor: 'pointer',
                border: `2px solid ${T.border}`, borderRadius: 14,
                background: T.card, transition: 'all 0.18s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
              }}
              onMouseEnter={e => {
                const b = e.currentTarget;
                b.style.borderColor = opt.color;
                b.style.transform   = 'translateY(-3px)';
                b.style.boxShadow   = `0 10px 28px ${opt.colorLight}`;
              }}
              onMouseLeave={e => {
                const b = e.currentTarget;
                b.style.borderColor = T.border;
                b.style.transform   = 'translateY(0)';
                b.style.boxShadow   = 'var(--t-shadow)';
              }}
            >
              <div style={{
                width: 68, height: 68, borderRadius: 18, marginBottom: 16,
                background: opt.colorLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: opt.color,
              }}>
                {opt.icon}
              </div>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 800, color: T.textPrimary, margin: '0 0 8px' }}>
                {opt.title}
              </h2>
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, lineHeight: 1.65, margin: 0 }}>
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2: Company / Vendor Selection ──────────────────────── */}
      {step === 2 && formData.entityType !== 'self' && (
        <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
            <span style={{
              fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted,
            }}>
              {formData.entityType === 'group_company' ? 'Select Group Company' : 'Select Vendor'}
            </span>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: T.textMuted, pointerEvents: 'none',
            }} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={`Search ${formData.entityType === 'group_company' ? 'group companies' : 'vendors'}…`}
              style={{ ...inputStyle(), paddingLeft: 34 }}
              autoFocus
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
                  display: 'flex', alignItems: 'center', padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Entity list */}
          {loadingEntities ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 72, borderRadius: 10, background: T.border, opacity: 0.4 }} />
              ))}
            </div>
          ) : filteredEntities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              {currentEntities.length === 0 ? (
                <>
                  <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginBottom: 14 }}>
                    {formData.entityType === 'group_company'
                      ? 'No group companies found. Add subsidiaries under Group Companies first.'
                      : 'No vendors found. Create a vendor first.'}
                  </p>
                  <Link
                    to={formData.entityType === 'group_company' ? '/company-groups' : '/vendors'}
                    style={{ textDecoration: 'none' }}
                  >
                    <button style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 18px', borderRadius: 9,
                      background: T.accent, color: '#fff',
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                      border: 'none', cursor: 'pointer',
                    }}>
                      {formData.entityType === 'group_company' ? 'Go to Group Companies' : 'Go to Vendors'}
                    </button>
                  </Link>
                </>
              ) : (
                <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
                  No results for "<strong>{searchQ}</strong>"
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 2 }}>
              {filteredEntities.map(entity => {
                const isSelected  = formData.vendorId === entity.id;
                const riskLevel   = entity.criticality_level || entity.risk_tier;
                return (
                  <label
                    key={entity.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accentLight : T.card,
                      transition: 'all 0.14s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLLabelElement;
                        el.style.borderColor = T.accent;
                        el.style.background  = T.accentLight;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLLabelElement;
                        el.style.borderColor = T.border;
                        el.style.background  = T.card;
                      }
                    }}
                  >
                    {/* Radio visual */}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.14s',
                    }}>
                      {isSelected && <Check size={11} style={{ color: '#fff' }} />}
                    </div>
                    <input
                      type="radio" name="entity" value={entity.id} checked={isSelected}
                      onChange={e => setFormData(f => ({ ...f, vendorId: e.target.value }))}
                      style={{ display: 'none' }}
                    />

                    {/* Entity info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                          color: T.textPrimary,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {entity.name}
                        </span>
                        {riskLevel && <RiskBadge level={riskLevel} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        {entity.industry && (
                          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                            {entity.industry}
                          </span>
                        )}
                        {entity.last_assessment_date ? (
                          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                            Last assessed: {formatDate(entity.last_assessment_date)}
                          </span>
                        ) : (
                          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textFaint }}>
                            No assessments yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score badge */}
                    {entity.latest_assessment_score != null && (
                      <div style={{
                        flexShrink: 0, width: 46, height: 46, borderRadius: 10,
                        background: T.accentLight,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 800, color: T.accent, lineHeight: 1 }}>
                          {Math.round(entity.latest_assessment_score)}
                        </span>
                        <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textMuted, marginTop: 1 }}>%</span>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${T.borderLight}` }}>
            <button
              onClick={() => setStep(1)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 8,
                background: T.card, color: T.textSecondary,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                border: `1px solid ${T.border}`, cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => { if (formData.vendorId) setStep(3); }}
              disabled={!formData.vendorId}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 20px', borderRadius: 8,
                background: formData.vendorId ? T.accent : T.border,
                color: formData.vendorId ? '#fff' : T.textMuted,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: formData.vendorId ? 'pointer' : 'not-allowed',
                boxShadow: formData.vendorId ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
                transition: 'all 0.14s',
              }}
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Assessment Details ──────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
              <span style={{
                fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted,
              }}>
                Assessment Details
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Name */}
              <div>
                <label style={{
                  fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                  color: T.textSecondary, display: 'block', marginBottom: 6,
                }}>
                  Assessment Name <span style={{ color: T.danger }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Q1 2025 Security Assessment"
                  required
                  style={inputStyle()}
                  autoFocus
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e =>  { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                  color: T.textSecondary, display: 'block', marginBottom: 6,
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional: Add notes about the scope and purpose of this assessment"
                  rows={4}
                  style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e =>  { (e.currentTarget as HTMLTextAreaElement).style.borderColor = T.border; }}
                />
              </div>

              {/* Summary card */}
              <div style={{
                background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                borderRadius: 10, padding: '16px 18px',
              }}>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.09em', textTransform: 'uppercase',
                  color: T.accent, marginBottom: 14,
                }}>
                  Assessment Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      label: 'Type',
                      value: formData.entityType === 'self'
                        ? 'Self-Assessment'
                        : formData.entityType === 'group_company'
                        ? 'Group Company Assessment'
                        : 'Vendor Assessment',
                    },
                    ...(formData.entityType !== 'self' && selectedEntity
                      ? [{ label: formData.entityType === 'group_company' ? 'Company' : 'Vendor', value: selectedEntity.name }]
                      : []),
                    { label: 'Framework',     value: 'NIST CSF 2.0' },
                    { label: 'Subcategories', value: '120 (across 6 functions)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>{row.label}</span>
                      <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
                  fontFamily: T.fontSans, fontSize: 13, color: T.danger,
                }}>
                  {errorMsg}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20, marginTop: 4, borderTop: `1px solid ${T.borderLight}` }}>
              <button
                type="button"
                onClick={() => setStep(formData.entityType === 'self' ? 1 : 2)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 8,
                  background: T.card, color: T.textSecondary,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${T.border}`, cursor: 'pointer',
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '9px 24px', borderRadius: 8,
                  background: loading ? T.border : T.accent,
                  color: loading ? T.textMuted : '#fff',
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 1px 3px rgba(79,70,229,0.3)',
                }}
              >
                {loading ? 'Creating…' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}
