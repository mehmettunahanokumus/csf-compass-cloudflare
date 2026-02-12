/**
 * VendorPortal - Rebuilt from scratch
 * Public page for vendors to complete self-assessments via magic link
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Circle, Ban, AlertCircle, Send } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import { csfApi } from '../api/csf';
import type {
  ValidateTokenResponse,
  Assessment,
  AssessmentItem,
  CsfFunction,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';

export default function VendorPortalNew() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<ValidateTokenResponse | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await vendorInvitationsApi.validate(token);

      if (!data.valid) {
        setError(data.error || 'Invalid or expired invitation link');
        return;
      }

      setValidationData(data);
      setAssessment(data.assessment || null);
      setCompleted(data.invitation?.invitation_status === 'completed');

      // Load CSF functions and assessment items
      if (data.assessment && token) {
        await loadAssessmentData(token);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentData = async (tokenValue: string) => {
    try {
      setLoadingItems(true);

      // Load CSF functions
      const functionsData = await csfApi.getFunctions();
      setFunctions(functionsData);

      // Set first function as default
      if (functionsData.length > 0) {
        setSelectedFunction(functionsData[0].id);
      }

      // Load assessment items
      const itemsData = await vendorInvitationsApi.getItems(tokenValue);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!token) return;

    try {
      const updatedItem = await vendorInvitationsApi.updateItem(token, itemId, {
        status: status as 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable'
      });

      // Update item in state
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? updatedItem : item))
      );
    } catch (err) {
      console.error('Failed to update item:', err);
      alert(getErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    if (!token) return;

    if (!confirm('Are you sure you want to submit this assessment? You will not be able to make changes after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      await vendorInvitationsApi.complete(token);
      setCompleted(true);
      alert('Assessment submitted successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle size={20} style={{ color: 'var(--green)' }} />;
      case 'partial':
        return <AlertCircle size={20} style={{ color: 'var(--orange)' }} />;
      case 'non_compliant':
        return <XCircle size={20} style={{ color: 'var(--red)' }} />;
      case 'not_applicable':
        return <Ban size={20} style={{ color: 'var(--text-4)' }} />;
      default:
        return <Circle size={20} style={{ color: 'var(--text-4)' }} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'Compliant' };
      case 'partial':
        return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'Partial' };
      case 'non_compliant':
        return { bg: 'var(--red-subtle)', color: 'var(--red-text)', label: 'Non-Compliant' };
      case 'not_applicable':
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'N/A' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'Not Assessed' };
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '16px', color: 'var(--text-3)' }}>Validating invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--red)', marginBottom: '20px' }}>
            <XCircle size={32} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--red)' }}>Invalid Invitation</h1>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.6 }}>
            {error}
          </p>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Please contact the organization that sent you this invitation for assistance.
          </div>
        </div>
      </div>
    );
  }

  if (!validationData || !assessment) {
    return null;
  }

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ground)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <CheckCircle size={64} style={{ color: 'var(--green)' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '12px' }}>
            Assessment Completed
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-3)', marginBottom: '24px', lineHeight: 1.6 }}>
            Thank you for completing the cybersecurity assessment. Your responses have been submitted successfully.
          </p>
          <div style={{ fontSize: '13px', color: 'var(--text-4)' }}>
            Completed on {formatDate(validationData.invitation?.completed_at || undefined)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ground)' }}>
      {/* Header */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
                {assessment.name}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
                Vendor Self-Assessment Portal
                {validationData.vendor_contact_name && (
                  <> · Welcome, {validationData.vendor_contact_name}</>
                )}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                background: submitting ? 'var(--ground)' : 'var(--accent)',
                color: submitting ? 'var(--text-4)' : 'var(--text-on-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = 'var(--accent)';
                }
              }}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>

          {validationData.invitation?.message && (
            <div
              style={{
                marginTop: '16px',
                background: 'var(--blue-subtle)',
                border: '1px solid var(--blue)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
              }}
            >
              <p style={{ fontSize: '13px', color: 'var(--blue-text)', lineHeight: 1.5 }}>
                {validationData.invitation.message}
              </p>
            </div>
          )}

          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-4)' }}>
            Expires on {formatDate(validationData.invitation?.token_expires_at)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
              NIST Cybersecurity Framework Assessment
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '24px', lineHeight: 1.6 }}>
              Please review each category and indicate your compliance status. You can save your progress and return later using the same link.
            </p>

            {/* Function Tabs */}
            <div style={{ borderBottom: '2px solid var(--border)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto' }}>
                {functions.map((func) => {
                  const isSelected = selectedFunction === func.id;
                  return (
                    <button
                      key={func.id}
                      onClick={() => setSelectedFunction(func.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                        padding: '12px 4px',
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? 'var(--accent)' : 'var(--text-3)',
                        cursor: 'pointer',
                        marginBottom: '-2px',
                        transition: 'all 150ms ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = 'var(--text-1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = 'var(--text-3)';
                        }
                      }}
                    >
                      {func.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assessment Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingItems ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '48px 20px' }}>
                  Loading assessment items...
                </div>
              ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '48px 20px' }}>
                  No assessment items found
                </div>
              ) : (
                <>
                  {items
                    .filter((item) => item.function?.id === selectedFunction)
                    .map((item) => {
                      const badge = getStatusBadge(item.status);
                      return (
                        <div
                          key={item.id}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '20px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                              {getStatusIcon(item.status)}
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                                  {item.subcategory?.id}
                                </h3>
                                <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)', marginTop: '2px' }}>
                                  {item.subcategory?.name}
                                </p>
                                {item.subcategory?.description && (
                                  <p style={{ fontSize: '14px', color: 'var(--text-3)', marginTop: '8px', lineHeight: 1.5 }}>
                                    {item.subcategory.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: badge.bg,
                                color: badge.color,
                                flexShrink: 0,
                              }}
                            >
                              {badge.label}
                            </div>
                          </div>

                          {/* Status Selection */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                            {[
                              { value: 'compliant', label: 'Compliant', color: 'var(--green)' },
                              { value: 'partial', label: 'Partial', color: 'var(--orange)' },
                              { value: 'non_compliant', label: 'Non-Compliant', color: 'var(--red)' },
                              { value: 'not_applicable', label: 'Not Applicable', color: 'var(--text-4)' },
                            ].map(({ value, label, color }) => {
                              const isSelected = item.status === value;
                              return (
                                <button
                                  key={value}
                                  onClick={() => handleStatusChange(item.id, value)}
                                  style={{
                                    background: isSelected ? color : 'var(--ground)',
                                    color: isSelected ? 'white' : 'var(--text-2)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = 'var(--raised)';
                                      e.currentTarget.style.color = 'var(--text-1)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = 'var(--ground)';
                                      e.currentTarget.style.color = 'var(--text-2)';
                                    }
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
