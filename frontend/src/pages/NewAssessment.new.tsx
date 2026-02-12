/**
 * NewAssessment - Rebuilt from scratch
 * Multi-step wizard for creating organization or vendor assessments
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, ClipboardCheck } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage } from '../api/client';
import Skeleton from '../components/Skeleton.new';

type AssessmentType = 'organization' | 'vendor';

interface FormData {
  type: AssessmentType;
  vendorId: string;
  name: string;
  description: string;
}

export default function NewAssessmentNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: 'organization',
    vendorId: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const vendorsData = await vendorsApi.list();
      setVendors(vendorsData);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleTypeSelect = (type: AssessmentType) => {
    setFormData({ ...formData, type });
    setStep(2);
  };

  const handleVendorSelect = (vendorId: string) => {
    setFormData({ ...formData, vendorId });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    // Validation for step 2 (vendor selection)
    if (step === 2 && formData.type === 'vendor' && !formData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an assessment name');
      return;
    }

    try {
      setLoading(true);
      const assessment = await assessmentsApi.create({
        assessment_type: formData.type,
        vendor_id: formData.type === 'vendor' ? formData.vendorId : undefined,
        name: formData.name,
        description: formData.description || undefined,
      });

      navigate(`/assessments/${assessment.id}`);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 2 && formData.type === 'vendor') {
      return !!formData.vendorId;
    }
    return true;
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return { bg: 'var(--red-subtle)', color: 'var(--red-text)' };
      case 'medium':
        return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)' };
      case 'low':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)' };
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'start', marginBottom: '32px' }}>
        <Link
          to="/assessments"
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
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
            Create New Assessment
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            Step <span style={{ fontFamily: 'var(--font-mono)' }}>{step}</span> of{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>3</span> -{' '}
            {step === 1
              ? 'Assessment Type'
              : step === 2
              ? formData.type === 'vendor'
                ? 'Select Vendor'
                : 'Assessment Details'
              : 'Assessment Details'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : 'unset' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  background: s <= step ? 'var(--accent)' : 'var(--ground)',
                  color: s <= step ? 'var(--text-on-accent)' : 'var(--text-4)',
                  transition: 'all 300ms ease',
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: '4px',
                    margin: '0 12px',
                    background: s < step ? 'var(--accent)' : 'var(--border)',
                    borderRadius: '999px',
                    transition: 'all 300ms ease',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Assessment Type */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
          {/* Organization Assessment */}
          <button
            onClick={() => handleTypeSelect('organization')}
            style={{
              background: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '36px 28px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: 'var(--shadow-xs)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Building2 size={64} style={{ color: 'var(--accent)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '10px' }}>
              Organization Assessment
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Assess your organization's cybersecurity posture against NIST CSF 2.0 framework
            </p>
          </button>

          {/* Vendor Assessment */}
          <button
            onClick={() => handleTypeSelect('vendor')}
            style={{
              background: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '36px 28px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: 'var(--shadow-xs)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--purple)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ClipboardCheck size={64} style={{ color: 'var(--purple)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '10px' }}>
              Vendor Assessment
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Evaluate a third-party vendor's security controls and compliance posture
            </p>
          </button>
        </div>
      )}

      {/* Step 2: Vendor Selection (only for vendor assessments) */}
      {step === 2 && formData.type === 'vendor' && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '20px' }}>
            Select Vendor
          </h2>

          {loadingVendors ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} w="100%" h="72px" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '20px' }}>
                No vendors found. Create a vendor first.
              </p>
              <Link
                to="/vendors"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Go to Vendors
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {vendors.map((vendor) => {
                const isSelected = formData.vendorId === vendor.id;
                const riskBadge = vendor.risk_level ? getRiskBadge(vendor.risk_level) : null;
                return (
                  <label
                    key={vendor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--card)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                        e.currentTarget.style.background = 'var(--raised)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'var(--card)';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="vendor"
                      value={vendor.id}
                      checked={isSelected}
                      onChange={(e) => handleVendorSelect(e.target.value)}
                      style={{
                        width: '20px',
                        height: '20px',
                        accentColor: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ flex: 1, marginLeft: '16px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>{vendor.name}</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>
                        {vendor.website || vendor.contact_email}
                      </p>
                    </div>
                    {riskBadge && (
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: riskBadge.bg,
                          color: riskBadge.color,
                        }}
                      >
                        {vendor.risk_level} risk
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleBack}
              style={{
                background: 'var(--card)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                background: canProceed() ? 'var(--accent)' : 'var(--ground)',
                color: canProceed() ? 'var(--text-on-accent)' : 'var(--text-4)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (canProceed()) {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (canProceed()) {
                  e.currentTarget.style.background = 'var(--accent)';
                }
              }}
            >
              Next
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 for organization assessments - auto-advance to step 3 */}
      {step === 2 && formData.type === 'organization' && (
        <div style={{ display: 'none' }}>{setTimeout(() => setStep(3), 0)}</div>
      )}

      {/* Step 3: Assessment Details */}
      {step === 3 && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '24px' }}>
            Assessment Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Assessment Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Assessment Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Q1 2024 Security Assessment"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  transition: 'all 150ms ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional: Add notes about the scope and purpose of this assessment"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'all 150ms ease',
                  fontFamily: 'var(--font-ui)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Summary */}
            <div
              style={{
                background: 'var(--ground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
                Assessment Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Type:</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                    {formData.type === 'organization' ? 'Organization Assessment' : 'Vendor Assessment'}
                  </span>
                </div>
                {formData.type === 'vendor' && formData.vendorId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Vendor:</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>
                      {vendors.find((v) => v.id === formData.vendorId)?.name}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Framework:</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>NIST CSF 2.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Subcategories:</span>
                  <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                    120 (across 6 functions)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '24px',
              marginTop: '24px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: 'var(--card)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--ground)' : 'var(--accent)',
                color: loading ? 'var(--text-4)' : 'var(--text-on-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--accent)';
                }
              }}
            >
              {loading ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
