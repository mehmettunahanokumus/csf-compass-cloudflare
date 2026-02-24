import { useState, useEffect, useRef } from 'react';
import { Link2, Copy, Check, AlertCircle, X, CheckCircle } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { SendInvitationResponse } from '../types';
import { getErrorMessage } from '../api/client';

interface InviteVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (response: SendInvitationResponse) => void;
  assessmentId: string;
  assessmentName: string;
  vendorEmail?: string;
  vendorName?: string;
}

// ─── Design tokens (matches AssessmentDetail pattern) ────────────────────────
const T = {
  card:         'var(--card)',
  ground:       'var(--ground, var(--surface-2))',
  border:       'var(--border)',
  text1:        'var(--text-1)',
  text2:        'var(--text-2)',
  text3:        'var(--text-3)',
  accent:       'var(--accent, #14B8A6)',
  accentLight:  'rgba(20,184,166,0.08)',
  accentBorder: 'rgba(20,184,166,0.25)',
  success:      '#22C55E',
  successLight: 'rgba(34,197,94,0.08)',
  successBorder:'rgba(34,197,94,0.25)',
  danger:       '#EF4444',
  fontSans:     'var(--font-sans)',
  fontMono:     'var(--font-mono)',
  inputBg:      'var(--input-bg, rgba(255,255,255,0.04))',
  inputBorder:  'var(--input-border, var(--border))',
  borderFocus:  'var(--border-focus, var(--accent, #14B8A6))',
  shadowLg:     'var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.3))',
};

// ─── Animation CSS ───────────────────────────────────────────────────────────
const MODAL_ANIM_CSS = `
@keyframes vlm-backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes vlm-modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes vlm-check-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
`;

export default function InviteVendorDialog({
  open,
  onOpenChange,
  onSend,
  assessmentId,
  assessmentName,
  vendorEmail = '',
  vendorName = '',
}: InviteVendorDialogProps) {
  const [email, setEmail] = useState(vendorEmail);
  const [contactName, setContactName] = useState(vendorName);
  const [expiryDays, setExpiryDays] = useState('30');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorLink, setVendorLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitationResponse, setInvitationResponse] = useState<SendInvitationResponse | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form state when dialog opens
  useEffect(() => {
    if (open) {
      setEmail(vendorEmail);
      setContactName(vendorName);
      setExpiryDays('30');
      setError(null);
      setVendorLink(null);
      setInvitationResponse(null);
      setCopied(false);
    }
  }, [open, vendorEmail, vendorName]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

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
        token_expiry_days: Number(expiryDays),
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
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  // ─── Shared styles ──────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: T.fontSans,
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: T.text2,
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 8,
    padding: '10px 14px',
    fontFamily: T.fontSans,
    fontSize: 13,
    color: T.text1,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const ghostBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 18px',
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: 'transparent',
    fontFamily: T.fontSans,
    fontSize: 13,
    fontWeight: 500,
    color: T.text2,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  const primaryBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 22px',
    borderRadius: 8,
    border: 'none',
    background: T.accent,
    fontFamily: T.fontSans,
    fontSize: 13,
    fontWeight: 600,
    color: '#FFF',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <>
      <style>{MODAL_ANIM_CSS}</style>

      {/* ── Backdrop ── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          animation: 'vlm-backdrop-in 150ms ease-out forwards',
        }}
      >
        {/* ── Modal box ── */}
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: T.card,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadowLg,
            width: '100%',
            maxWidth: 460,
            padding: 0,
            animation: 'vlm-modal-in 200ms ease-out forwards',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {vendorLink ? (
            /* ════════════════ SUCCESS STATE ════════════════ */
            <div style={{ padding: 24 }}>
              {/* Check icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  background: T.successLight,
                  border: `1.5px solid ${T.successBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'vlm-check-pop 400ms ease-out forwards',
                }}>
                  <CheckCircle size={26} style={{ color: T.success }} />
                </div>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: T.fontSans, fontSize: 18, fontWeight: 600,
                color: T.text1, textAlign: 'center', marginBottom: 6,
              }}>
                Vendor Link Created!
              </div>
              <div style={{
                fontFamily: T.fontSans, fontSize: 13, color: T.text3,
                textAlign: 'center', marginBottom: 20, lineHeight: 1.5,
              }}>
                Copy this link and send it to the vendor.
              </div>

              {/* Copy-able link box */}
              <div style={{
                background: T.ground,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}>
                <div style={{
                  flex: 1,
                  fontFamily: T.fontMono,
                  fontSize: 11,
                  color: T.text2,
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.6,
                  userSelect: 'all',
                }}>
                  {vendorLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 6, flexShrink: 0,
                    border: `1px solid ${copied ? T.successBorder : T.border}`,
                    background: copied ? T.successLight : 'transparent',
                    fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                    color: copied ? T.success : T.text2,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>

              {/* Expiry warning */}
              <div style={{
                fontFamily: T.fontSans, fontSize: 12, color: T.text3,
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 24,
              }}>
                <span style={{ fontSize: 14 }}>&#9888;</span>
                This link expires in {expiryDays} days
              </div>

              {/* Done button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClose}
                  style={primaryBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ════════════════ FORM STATE ════════════════ */
            <>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Link2 size={16} style={{ color: T.accent }} />
                  </div>
                  <span style={{
                    fontFamily: T.fontSans, fontSize: 16, fontWeight: 600, color: T.text1,
                  }}>
                    Create Vendor Link
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 6,
                    border: 'none', background: 'transparent',
                    color: T.text3, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; e.currentTarget.style.color = T.text1; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: T.border, margin: '0 24px' }} />

              {/* Form body */}
              <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                {/* Error */}
                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 18,
                  }}>
                    <AlertCircle size={16} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, lineHeight: 1.5 }}>{error}</span>
                  </div>
                )}

                {/* Assessment (read-only display) */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Assessment</label>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 13, color: T.text2, lineHeight: 1.5,
                  }}>
                    {assessmentName}
                  </div>
                </div>

                {/* Vendor Email */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>
                    Vendor Email <span style={{ color: T.danger }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    required
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = T.borderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(20,184,166,0.1)`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 11, color: T.text3,
                    fontStyle: 'italic', marginTop: 5,
                  }}>
                    For your records only — no email will be sent
                  </div>
                </div>

                {/* Vendor Contact Name */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>
                    Vendor Contact Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.text3 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = T.borderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(20,184,166,0.1)`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Link Expiration */}
                <div style={{ marginBottom: 0 }}>
                  <label style={labelStyle}>Link Expiration</label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      appearance: 'auto',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.borderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(20,184,166,0.1)`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days (recommended)</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', gap: 12,
                  marginTop: 24, paddingTop: 18,
                  borderTop: `1px solid ${T.border}`,
                }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={creating}
                    style={{
                      ...ghostBtnStyle,
                      opacity: creating ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!creating) { e.currentTarget.style.background = 'rgba(148,163,184,0.08)'; e.currentTarget.style.color = T.text1; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      ...primaryBtnStyle,
                      opacity: creating ? 0.7 : 1,
                      cursor: creating ? 'wait' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!creating) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = creating ? '0.7' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Link2 size={14} />
                    {creating ? 'Creating Link...' : 'Create Link'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
