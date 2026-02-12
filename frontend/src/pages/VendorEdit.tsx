/**
 * VendorEdit - Edit existing vendor (pre-filled form)
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { vendorsApi, type UpdateVendorData } from '../api/vendors';
import { getErrorMessage } from '../api/client';
import Skeleton from '../components/Skeleton.new';

interface FormErrors {
  name?: string;
  contact_email?: string;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-2)',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  color: 'var(--text-1)',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  transition: 'border-color 150ms ease',
  boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: 'var(--red)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-1)',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border)',
};

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Energy',
  'Government',
  'Education',
  'Other',
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VendorEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    criticality_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    vendor_status: 'active' as 'active' | 'inactive' | 'under_review' | 'terminated',
    notes: '',
  });

  useEffect(() => {
    loadVendor();
  }, [id]);

  const loadVendor = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const vendor = await vendorsApi.get(id);
      setForm({
        name: vendor.name || '',
        industry: vendor.industry || '',
        website: vendor.website || '',
        contact_name: vendor.contact_name || '',
        contact_email: vendor.contact_email || '',
        contact_phone: vendor.contact_phone || '',
        criticality_level: vendor.criticality_level || vendor.risk_tier || 'medium',
        vendor_status: vendor.vendor_status || 'active',
        notes: vendor.notes || '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    if (form.contact_email && !emailRegex.test(form.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !validate()) return;

    try {
      setSubmitting(true);
      const data: UpdateVendorData = {
        name: form.name.trim(),
      };
      if (form.industry) data.industry = form.industry;
      if (form.website) data.website = form.website;
      if (form.contact_name) data.contact_name = form.contact_name;
      if (form.contact_email) data.contact_email = form.contact_email;
      if (form.contact_phone) data.contact_phone = form.contact_phone;
      if (form.criticality_level) data.criticality_level = form.criticality_level;
      if (form.vendor_status) data.vendor_status = form.vendor_status;
      if (form.notes) data.notes = form.notes;

      await vendorsApi.update(id, data);
      navigate(`/vendors/${id}`);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--accent)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, hasError: boolean) => {
    e.currentTarget.style.borderColor = hasError ? 'var(--red)' : 'var(--border)';
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px' }}>
          <Skeleton w="40px" h="40px" />
          <Skeleton w="200px" h="28px" />
        </div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
          }}
        >
          <Skeleton w="150px" h="20px" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton w="80px" h="14px" />
                <Skeleton w="100%" h="42px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--red-subtle)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--red-text)',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px' }}>
        <Link
          to={`/vendors/${id}`}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            textDecoration: 'none',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--raised)';
            e.currentTarget.style.color = 'var(--text-1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)';
            e.currentTarget.style.color = 'var(--text-3)';
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>
          Edit Vendor
        </h1>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
        }}
      >
        {/* Section 1: Basic Information */}
        <div style={{ padding: '28px' }}>
          <h2 style={sectionTitleStyle}>Basic Information</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Vendor Name */}
            <div>
              <label style={labelStyle}>
                Vendor Name <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter vendor name"
                style={errors.name ? inputErrorStyle : inputStyle}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.name)}
              />
              {errors.name && (
                <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label style={labelStyle}>Industry</label>
              <select
                value={form.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, false)}
              >
                <option value="">Select industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div>
              <label style={labelStyle}>Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, false)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div style={{ padding: '0 28px 28px' }}>
          <h2 style={sectionTitleStyle}>Contact Information</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Contact Name */}
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                placeholder="John Doe"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, false)}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                placeholder="contact@vendor.com"
                style={errors.contact_email ? inputErrorStyle : inputStyle}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.contact_email)}
              />
              {errors.contact_email && (
                <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>
                  {errors.contact_email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, false)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Risk Management */}
        <div style={{ padding: '0 28px 28px' }}>
          <h2 style={sectionTitleStyle}>Risk Management</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Criticality Level */}
            <div>
              <label style={labelStyle}>Criticality Level</label>
              <select
                value={form.criticality_level}
                onChange={(e) => updateField('criticality_level', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, false)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Vendor Status */}
            <div>
              <label style={labelStyle}>Vendor Status</label>
              <select
                value={form.vendor_status}
                onChange={(e) => updateField('vendor_status', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, false)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Notes */}
        <div style={{ padding: '0 28px 28px' }}>
          <h2 style={sectionTitleStyle}>Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={5}
            placeholder="Any additional notes about this vendor..."
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: 'var(--font-ui)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
        </div>

        {/* Form Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '20px 28px',
            borderTop: '1px solid var(--border)',
            background: 'var(--raised)',
          }}
        >
          <Link
            to={`/vendors/${id}`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-2)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--raised)';
              e.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--text-2)';
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-on-accent)',
              background: submitting ? 'var(--text-4)' : 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            Update Vendor
          </button>
        </div>
      </form>
    </div>
  );
}
