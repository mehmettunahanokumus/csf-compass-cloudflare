import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { vendorsApi, type CreateVendorData } from '../api/vendors';
import { getErrorMessage } from '../api/client';

import { T, card, sectionLabel, fieldLabel, inputStyle } from '../tokens';

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing',
  'Retail', 'Energy', 'Government', 'Education', 'Other',
];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors { name?: string; contact_email?: string; }

export default function VendorNew() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: '', industry: '', website: '',
    contact_name: '', contact_email: '', contact_phone: '',
    criticality_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    vendor_status: 'active' as 'active' | 'inactive' | 'under_review' | 'terminated',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Vendor name is required';
    if (form.contact_email && !emailRegex.test(form.contact_email)) e.contact_email = 'Please enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const data: CreateVendorData = { name: form.name.trim() };
      if (form.industry)          data.industry = form.industry;
      if (form.website)           data.website = form.website;
      if (form.contact_name)      data.contact_name = form.contact_name;
      if (form.contact_email)     data.contact_email = form.contact_email;
      if (form.contact_phone)     data.contact_phone = form.contact_phone;
      if (form.criticality_level) data.criticality_level = form.criticality_level;
      if (form.vendor_status)     data.vendor_status = form.vendor_status;
      if (form.notes)             data.notes = form.notes;
      await vendorsApi.create(data);
      navigate('/vendors');
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  const Section = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
      <span style={sectionLabel}>{title}</span>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/vendors" style={{ textDecoration: 'none' }}>
          <div style={{
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
            Add New Vendor
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 2 }}>
            Register a new third-party vendor
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ ...card, overflow: 'hidden' }}>

          {/* Section 1: Basic */}
          <div style={{ padding: '24px 24px 20px' }}>
            <Section title="Basic Information" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={fieldLabel}>Vendor Name <span style={{ color: T.danger }}>*</span></label>
                <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                  placeholder="Enter vendor name" style={inputStyle(!!errors.name)}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = errors.name ? 'rgba(220,38,38,0.4)' : T.border; }}
                />
                {errors.name && <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.danger, marginTop: 4 }}>{errors.name}</p>}
              </div>
              <div>
                <label style={fieldLabel}>Industry</label>
                <select value={form.industry} onChange={e => updateField('industry', e.target.value)}
                  style={{ ...inputStyle(), cursor: 'pointer' }}>
                  <option value="">Select industry</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Website</label>
                <input type="url" value={form.website} onChange={e => updateField('website', e.target.value)}
                  placeholder="https://example.com" style={inputStyle()}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: T.borderLight, margin: '0 24px' }} />

          {/* Section 2: Contact */}
          <div style={{ padding: '20px 24px' }}>
            <Section title="Contact Information" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={fieldLabel}>Contact Name</label>
                <input type="text" value={form.contact_name} onChange={e => updateField('contact_name', e.target.value)}
                  placeholder="John Doe" style={inputStyle()}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
                />
              </div>
              <div>
                <label style={fieldLabel}>Email</label>
                <input type="email" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)}
                  placeholder="contact@vendor.com" style={inputStyle(!!errors.contact_email)}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = errors.contact_email ? 'rgba(220,38,38,0.4)' : T.border; }}
                />
                {errors.contact_email && <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.danger, marginTop: 4 }}>{errors.contact_email}</p>}
              </div>
              <div>
                <label style={fieldLabel}>Phone</label>
                <input type="text" value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567" style={inputStyle()}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: T.borderLight, margin: '0 24px' }} />

          {/* Section 3: Risk */}
          <div style={{ padding: '20px 24px' }}>
            <Section title="Risk Management" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={fieldLabel}>Criticality Level</label>
                <select value={form.criticality_level} onChange={e => updateField('criticality_level', e.target.value)}
                  style={{ ...inputStyle(), cursor: 'pointer' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Vendor Status</label>
                <select value={form.vendor_status} onChange={e => updateField('vendor_status', e.target.value)}
                  style={{ ...inputStyle(), cursor: 'pointer' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: T.borderLight, margin: '0 24px' }} />

          {/* Section 4: Notes */}
          <div style={{ padding: '20px 24px' }}>
            <Section title="Notes" />
            <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)}
              rows={4} placeholder="Any additional notes about this vendor..."
              style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#A5B4FC'; }}
              onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = T.border; }}
            />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            padding: '14px 24px', borderTop: `1px solid ${T.borderLight}`,
            background: '#F8FAFC',
          }}>
            <Link to="/vendors" style={{ textDecoration: 'none' }}>
              <button type="button" style={{
                padding: '8px 18px', borderRadius: 8,
                background: T.card, color: T.textSecondary,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                border: `1px solid ${T.border}`, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </Link>
            <button type="submit" disabled={submitting} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 20px', borderRadius: 8,
              background: submitting ? '#E2E8F0' : T.accent,
              color: submitting ? T.textMuted : '#fff',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 1px 3px rgba(79,70,229,0.3)',
              transition: 'background 0.15s',
            }}>
              {submitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Create Vendor
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
