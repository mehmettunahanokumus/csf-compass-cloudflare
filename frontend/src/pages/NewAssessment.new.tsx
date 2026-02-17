import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, ClipboardCheck, Check } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage } from '../api/client';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  card:         '#FFFFFF',
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',
  textPrimary:  '#0F172A',
  textSecondary:'#64748B',
  textMuted:    '#94A3B8',
  textFaint:    '#CBD5E1',
  accent:       '#4F46E5',
  accentLight:  'rgba(79,70,229,0.08)',
  accentBorder: 'rgba(79,70,229,0.2)',
  success:      '#16A34A',
  successLight: 'rgba(22,163,74,0.08)',
  danger:       '#DC2626',
  fontSans:     'Manrope, sans-serif',
  fontMono:     'JetBrains Mono, monospace',
  fontDisplay:  'Barlow Condensed, sans-serif',
};

const card: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`,
  borderRadius: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: `1px solid ${T.border}`, outline: 'none',
  fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary,
  background: T.card, transition: 'border-color 0.15s', boxSizing: 'border-box',
};

type AssessmentType = 'organization' | 'vendor';
interface FormData { type: AssessmentType; vendorId: string; name: string; description: string; }

const stepLabels = ['Assessment Type', 'Vendor Selection', 'Assessment Details'];

export default function NewAssessmentNew() {
  const navigate = useNavigate();
  const [step,           setStep]           = useState(1);
  const [vendors,        setVendors]        = useState<Vendor[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [formData, setFormData] = useState<FormData>({ type: 'organization', vendorId: '', name: '', description: '' });

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      setVendors(await vendorsApi.list());
    } catch { /* ignore */ }
    finally { setLoadingVendors(false); }
  };

  const handleTypeSelect = (type: AssessmentType) => {
    setFormData(f => ({ ...f, type }));
    setStep(type === 'vendor' ? 2 : 3);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.name.trim()) { alert('Please enter an assessment name'); return; }
    try {
      setLoading(true);
      const assessment = await assessmentsApi.create({
        assessment_type: formData.type,
        vendor_id: formData.type === 'vendor' ? formData.vendorId : undefined,
        name: formData.name,
        description: formData.description || undefined,
      });
      navigate(`/assessments/${assessment.id}`);
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const canProceed = () => step !== 2 || !!formData.vendorId;

  const effectiveStep = step === 3 ? 3 : (step === 2 && formData.type === 'vendor') ? 2 : step;

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/assessments" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: T.card, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textMuted, cursor: 'pointer',
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
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 2 }}>
            Step <span style={{ fontFamily: T.fontMono }}>{effectiveStep}</span> of{' '}
            <span style={{ fontFamily: T.fontMono }}>{formData.type === 'organization' ? 2 : 3}</span>
            {' '}— {stepLabels[effectiveStep - 1]}
          </p>
        </div>
      </div>

      {/* Progress stepper */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[1, 2, 3].filter(s => formData.type === 'organization' ? s !== 2 : true).map((s, idx, arr) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: idx < arr.length - 1 ? 1 : 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s <= step ? T.accent : '#F1F5F9',
                color: s <= step ? '#fff' : T.textFaint,
                transition: 'all 0.3s',
              }}>
                {s < step
                  ? <Check size={16} />
                  : <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>{idx + 1}</span>
                }
              </div>
              {idx < arr.length - 1 && (
                <div style={{
                  flex: 1, height: 3, borderRadius: 2, margin: '0 10px',
                  background: s < step ? T.accent : '#F1F5F9', transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Assessment Type */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              type: 'organization' as AssessmentType,
              icon: <Building2 size={52} />,
              color: T.accent,
              colorLight: T.accentLight,
              title: 'Organization Assessment',
              desc: "Assess your organization's cybersecurity posture against NIST CSF 2.0 framework",
            },
            {
              type: 'vendor' as AssessmentType,
              icon: <ClipboardCheck size={52} />,
              color: '#8B5CF6',
              colorLight: 'rgba(139,92,246,0.08)',
              title: 'Vendor Assessment',
              desc: 'Evaluate a third-party vendor\'s security controls and compliance posture',
            },
          ].map(opt => (
            <button
              key={opt.type}
              onClick={() => handleTypeSelect(opt.type)}
              style={{
                ...card, padding: '40px 32px',
                textAlign: 'center', cursor: 'pointer',
                border: `2px solid ${T.border}`, borderRadius: 12,
                background: T.card, transition: 'all 0.18s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = opt.color; b.style.transform = 'translateY(-2px)'; b.style.boxShadow = `0 8px 24px ${opt.colorLight}`; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = T.border; b.style.transform = 'translateY(0)'; b.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'; }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: 20, marginBottom: 20,
                background: opt.colorLight, border: `1px solid ${opt.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.color,
              }}>
                {opt.icon}
              </div>
              <h2 style={{ fontFamily: T.fontSans, fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: '0 0 10px' }}>
                {opt.title}
              </h2>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Vendor Selection */}
      {step === 2 && formData.type === 'vendor' && (
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted }}>
              Select Vendor
            </span>
          </div>

          {loadingVendors ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-pulse">
              {[1,2,3].map(i => <div key={i} style={{ height: 68, borderRadius: 10, background: T.borderLight }} />)}
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                No vendors found. Create a vendor first.
              </p>
              <Link to="/vendors" style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9,
                  background: T.accent, color: '#fff',
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                }}>
                  Go to Vendors
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {vendors.map(vendor => {
                const isSelected = formData.vendorId === vendor.id;
                return (
                  <label key={vendor.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${isSelected ? T.accent : T.border}`,
                    background: isSelected ? T.accentLight : T.card,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? T.accent : T.border}`,
                      background: isSelected ? T.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && <Check size={11} style={{ color: '#fff' }} />}
                    </div>
                    <input type="radio" name="vendor" value={vendor.id} checked={isSelected}
                      onChange={e => setFormData(f => ({ ...f, vendorId: e.target.value }))}
                      style={{ display: 'none' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                        {vendor.name}
                      </p>
                      {(vendor.website || vendor.contact_email) && (
                        <p style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>
                          {vendor.website || vendor.contact_email}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20, borderTop: `1px solid ${T.borderLight}` }}>
            <button onClick={() => setStep(1)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 8,
              background: T.card, color: T.textSecondary,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              border: `1px solid ${T.border}`, cursor: 'pointer',
            }}>
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={() => { if (canProceed()) setStep(3); else alert('Please select a vendor'); }}
              disabled={!canProceed()} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 8,
                background: canProceed() ? T.accent : '#E2E8F0',
                color: canProceed() ? '#fff' : T.textMuted,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed',
                boxShadow: canProceed() ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
              }}>
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Assessment Details */}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
              <span style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted }}>
                Assessment Details
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Name */}
              <div>
                <label style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 6 }}>
                  Assessment Name <span style={{ color: T.danger }}>*</span>
                </label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Q1 2025 Security Assessment" required style={inputStyle}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional: Add notes about the scope and purpose of this assessment"
                  rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = T.border; }}
                />
              </div>

              {/* Summary card */}
              <div style={{
                background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                borderRadius: 10, padding: '16px 18px',
              }}>
                <div style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>
                  Assessment Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Type', value: formData.type === 'organization' ? 'Organization Assessment' : 'Vendor Assessment' },
                    ...(formData.type === 'vendor' && formData.vendorId
                      ? [{ label: 'Vendor', value: vendors.find(v => v.id === formData.vendorId)?.name || '—' }]
                      : []),
                    { label: 'Framework', value: 'NIST CSF 2.0' },
                    { label: 'Subcategories', value: '120 (across 6 functions)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>{row.label}</span>
                      <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20, marginTop: 4, borderTop: `1px solid ${T.borderLight}` }}>
              <button type="button" onClick={() => setStep(formData.type === 'vendor' ? 2 : 1)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 8,
                background: T.card, color: T.textSecondary,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                border: `1px solid ${T.border}`, cursor: 'pointer',
              }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="submit" disabled={loading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 24px', borderRadius: 8,
                background: loading ? '#E2E8F0' : T.accent,
                color: loading ? T.textMuted : '#fff',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 1px 3px rgba(79,70,229,0.3)',
              }}>
                {loading ? 'Creating…' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
