/**
 * Create Vendor Link Modal
 * Modal for generating reusable vendor assessment links
 */

import { useState } from 'react';
import { X, Link2, Copy, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { SendInvitationResponse } from '../types';
import { getErrorMessage } from '../api/client';
import { T, card, inputStyle } from '../tokens';

interface SendToVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (response: SendInvitationResponse) => void;
  assessmentId: string;
  assessmentName: string;
  vendorEmail?: string;
  vendorName?: string;
}

export default function SendToVendorModal({
  isOpen,
  onClose,
  onSend,
  assessmentId,
  assessmentName,
  vendorEmail = '',
  vendorName = '',
}: SendToVendorModalProps) {
  const [email, setEmail] = useState(vendorEmail);
  const [contactName, setContactName] = useState(vendorName);
  const [expiryDays, setExpiryDays] = useState(30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorLink, setVendorLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitationResponse, setInvitationResponse] = useState<SendInvitationResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Vendor email is required for your records');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await vendorInvitationsApi.send({
        organization_assessment_id: assessmentId,
        vendor_contact_email: email,
        vendor_contact_name: contactName || undefined,
        token_expiry_days: expiryDays,
      });

      setVendorLink(response.magic_link);
      setInvitationResponse(response);
      onSend(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!vendorLink) return;

    try {
      await navigator.clipboard.writeText(vendorLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRevoke = async () => {
    if (!invitationResponse) return;

    if (!confirm('Are you sure you want to revoke this link? The vendor will no longer be able to access the assessment.')) {
      return;
    }

    try {
      await vendorInvitationsApi.revoke(invitationResponse.invitation_id);
      alert('Link revoked successfully');
      handleClose();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    setEmail(vendorEmail);
    setContactName(vendorName);
    setExpiryDays(30);
    setError(null);
    setVendorLink(null);
    setInvitationResponse(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: T.fontSans,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: T.textMuted,
    marginBottom: 6,
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...card,
          maxWidth: 560,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <h2 style={{
            fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700,
            color: T.textPrimary, margin: 0,
          }}>
            {vendorLink ? 'Vendor Link Created' : 'Create Vendor Link'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8,
              background: 'transparent', border: 'none',
              color: T.textMuted, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.bg; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {vendorLink ? (
            <>
              {/* Success banner */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', borderRadius: 10,
                background: T.successLight, border: `1px solid ${T.successBorder}`,
              }}>
                <Check size={18} style={{ color: T.success, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.success, marginBottom: 2 }}>
                    Link created successfully!
                  </div>
                  <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    Copy this link and send it to the vendor via email, Slack, or your preferred communication method.
                  </p>
                </div>
              </div>

              {/* Link input */}
              <div>
                <label style={labelStyle}>
                  Vendor Assessment Link (expires in {expiryDays} days)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={vendorLink}
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                    style={{
                      ...inputStyle(),
                      flex: 1,
                      fontFamily: T.fontMono,
                      fontSize: 11,
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8, flexShrink: 0,
                      background: copied ? T.successLight : T.card,
                      border: `1px solid ${copied ? T.successBorder : T.border}`,
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      color: copied ? T.success : T.textSecondary,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
                <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, marginTop: 6 }}>
                  You can also access this link anytime from the assessment detail page.
                </p>
              </div>

              {/* Next steps */}
              <div style={{
                padding: '14px 18px', borderRadius: 10,
                background: T.bg, border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.accent}`,
              }}>
                <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>
                  Next Steps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Copy the link above using the "Copy" button',
                    'Send it to the vendor via email, Slack, Teams, or any method you prefer',
                    'The vendor can use this link multiple times (bookmark-friendly)',
                    'Once submitted, view the comparison to see differences in your assessments',
                    `The link will expire in ${expiryDays} days`,
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <ChevronRight size={12} style={{ color: T.accent, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 16, borderTop: `1px solid ${T.border}`,
              }}>
                <button
                  onClick={handleRevoke}
                  style={{
                    padding: 0, background: 'none', border: 'none',
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                    color: T.danger, cursor: 'pointer',
                  }}
                >
                  Revoke Link
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '10px 22px', borderRadius: 9,
                    background: T.accent, color: '#fff', border: 'none',
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
                }}>
                  <AlertCircle size={16} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger }}>{error}</span>
                </div>
              )}

              {/* Info note */}
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: T.bg, border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.accent}`,
              }}>
                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: T.textPrimary }}>Note:</span> This creates a reusable link that you'll manually send to the vendor.
                  No email is sent automatically.
                </p>
              </div>

              {/* Assessment name */}
              <div>
                <label style={labelStyle}>Assessment</label>
                <input
                  type="text"
                  value={assessmentName}
                  readOnly
                  style={{ ...inputStyle(), background: T.bg }}
                />
              </div>

              {/* Vendor email */}
              <div>
                <label style={labelStyle}>
                  Vendor Email <span style={{ color: T.danger }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  style={inputStyle()}
                  required
                />
                <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, marginTop: 4 }}>
                  For your records only — no email will be sent
                </p>
              </div>

              {/* Contact name */}
              <div>
                <label style={labelStyle}>Vendor Contact Name (Optional)</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  style={inputStyle()}
                />
              </div>

              {/* Expiration */}
              <div>
                <label style={labelStyle}>Link Expiration</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  style={inputStyle()}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (recommended)</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              {/* Submit buttons */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
                paddingTop: 16, borderTop: `1px solid ${T.border}`,
              }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={creating}
                  style={{
                    padding: '10px 18px', borderRadius: 9,
                    background: T.card, border: `1px solid ${T.border}`,
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                    color: T.textSecondary, cursor: 'pointer',
                    opacity: creating ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '10px 22px', borderRadius: 9,
                    background: T.accent, color: '#fff', border: 'none',
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <Link2 size={14} />
                  {creating ? 'Creating Link...' : 'Create Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
