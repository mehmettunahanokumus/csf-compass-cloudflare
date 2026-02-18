/**
 * New Vendor Modal — MERIDIAN design
 * Clean, polished modal with T token support for light/dark mode.
 */

import { useState, useEffect, useRef } from 'react';
import {
  X, Plus, AlertCircle, Building2, Globe,
  User, Phone, Mail, ChevronDown,
} from 'lucide-react';
import { vendorsApi, type CreateVendorData } from '../api/vendors';
import { getErrorMessage } from '../api/client';
import type { Vendor } from '../types';
import { T, fieldLabel, inputStyle } from '../tokens';

interface NewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (vendor: Vendor) => void;
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing',
  'Retail', 'Energy', 'Government', 'Education',
  'Consulting', 'Legal', 'Transportation', 'Other',
];

const CRITICALITY_OPTIONS: {
  value: CreateVendorData['criticality_level'];
  label: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
}[] = [
  { value: 'low',      label: 'Low',      color: '#16A34A', bg: 'var(--t-success-light)', border: 'rgba(22,163,74,0.25)',   desc: 'Minimal impact'    },
  { value: 'medium',   label: 'Medium',   color: '#4F46E5', bg: 'var(--t-accent-light)',  border: 'rgba(79,70,229,0.25)',   desc: 'Moderate impact'   },
  { value: 'high',     label: 'High',     color: '#D97706', bg: 'var(--t-warning-light)', border: 'rgba(217,119,6,0.25)',   desc: 'High impact'       },
  { value: 'critical', label: 'Critical', color: '#DC2626', bg: 'var(--t-danger-light)',  border: 'rgba(220,38,38,0.25)',   desc: 'Critical dependency' },
];

// ── Section divider ────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
      <span style={{
        fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted,
      }}>
        {title}
      </span>
    </div>
  );
}

// ── Icon-prefixed input wrapper ────────────────────────────────
function IconInput({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        color: T.textMuted, pointerEvents: 'none', display: 'flex',
      }}>
        {icon}
      </span>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function NewVendorModal({ isOpen, onClose, onCreate }: NewVendorModalProps) {
  const defaultForm: CreateVendorData = {
    name: '', industry: '', website: '',
    contact_name: '', contact_email: '', contact_phone: '',
    criticality_level: 'medium', vendor_status: 'active', notes: '',
  };

  const [formData, setFormData] = useState<CreateVendorData>(defaultForm);
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [nameError,  setNameError]  = useState<string | null>(null);
  const [visible,    setVisible]    = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      setTimeout(() => nameRef.current?.focus(), 120);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setFormData(defaultForm);
      setError(null);
      setNameError(null);
      onClose();
    }, 200);
  };

  const update = <K extends keyof CreateVendorData>(k: K, v: CreateVendorData[K]) =>
    setFormData(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNameError('Vendor name is required');
      nameRef.current?.focus();
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const vendor = await vendorsApi.create(formData);
      onCreate(vendor);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const crit = CRITICALITY_OPTIONS.find(o => o.value === formData.criticality_level)!;

  // shared input focus/blur handlers
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#A5B4FC';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, hasErr = false) => {
    e.currentTarget.style.borderColor = hasErr ? 'rgba(220,38,38,0.4)' : T.border;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 48,
          background: visible ? 'rgba(15,23,42,0.4)' : 'transparent',
          backdropFilter: visible ? 'blur(4px)' : 'none',
          transition: 'background 0.2s, backdrop-filter 0.2s',
        }}
      />

      {/* Dialog wrapper */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 49,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, pointerEvents: 'none',
        }}
      >
        {/* Dialog */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            boxShadow: '0 32px 64px rgba(15,23,42,0.18), 0 8px 24px rgba(15,23,42,0.08)',
            width: '100%', maxWidth: 620,
            maxHeight: '90vh', overflowY: 'auto',
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.96)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1), opacity 0.18s ease',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${T.borderLight}`,
            position: 'sticky', top: 0, background: T.card, zIndex: 1,
            borderRadius: '18px 18px 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={18} style={{ color: T.accent }} />
              </div>
              <div>
                <h2 style={{
                  fontFamily: T.fontSans, fontSize: 16, fontWeight: 800,
                  color: T.textPrimary, margin: 0, letterSpacing: '-0.01em',
                }}>
                  Add New Vendor
                </h2>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, margin: '2px 0 0',
                }}>
                  Register a vendor for security assessment tracking
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'none', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.textMuted, cursor: 'pointer', transition: 'all 0.13s',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = T.borderLight; b.style.color = T.textPrimary; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'none'; b.style.color = T.textMuted; }}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Body ── */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '24px' }}>

              {/* Error banner */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  background: T.dangerLight, border: `1px solid rgba(220,38,38,0.2)`,
                  marginBottom: 20,
                }}>
                  <AlertCircle size={15} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
                </div>
              )}

              {/* ── Section: Basic ── */}
              <SectionHeader title="Basic Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>

                {/* Vendor Name — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={fieldLabel}>
                    Vendor Name <span style={{ color: T.danger }}>*</span>
                  </label>
                  <IconInput icon={<Building2 size={13} />}>
                    <input
                      ref={nameRef}
                      type="text"
                      value={formData.name}
                      onChange={e => { update('name', e.target.value); setNameError(null); }}
                      placeholder="Acme Corporation"
                      style={{ ...inputStyle(!!nameError), paddingLeft: 32 }}
                      onFocus={onFocus}
                      onBlur={e => onBlur(e, !!nameError)}
                    />
                  </IconInput>
                  {nameError && (
                    <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.danger, margin: '4px 0 0' }}>
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <label style={fieldLabel}>Industry</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={formData.industry}
                      onChange={e => update('industry', e.target.value)}
                      style={{ ...inputStyle(), paddingRight: 30, cursor: 'pointer', appearance: 'none' as const }}
                      onFocus={onFocus}
                      onBlur={e => onBlur(e)}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <ChevronDown size={13} style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none',
                    }} />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label style={fieldLabel}>Website</label>
                  <IconInput icon={<Globe size={13} />}>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={e => update('website', e.target.value)}
                      placeholder="https://example.com"
                      style={{ ...inputStyle(), paddingLeft: 32 }}
                      onFocus={onFocus}
                      onBlur={e => onBlur(e)}
                    />
                  </IconInput>
                </div>
              </div>

              {/* ── Section: Contact ── */}
              <SectionHeader title="Contact Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>

                {/* Contact Name — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={fieldLabel}>Contact Name</label>
                  <IconInput icon={<User size={13} />}>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={e => update('contact_name', e.target.value)}
                      placeholder="Jane Smith"
                      style={{ ...inputStyle(), paddingLeft: 32 }}
                      onFocus={onFocus}
                      onBlur={e => onBlur(e)}
                    />
                  </IconInput>
                </div>

                {/* Email */}
                <div>
                  <label style={fieldLabel}>Email</label>
                  <IconInput icon={<Mail size={13} />}>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={e => update('contact_email', e.target.value)}
                      placeholder="jane@acme.com"
                      style={{ ...inputStyle(), paddingLeft: 32 }}
                      onFocus={onFocus}
                      onBlur={e => onBlur(e)}
                    />
                  </IconInput>
                </div>

                {/* Phone */}
                <div>
                  <label style={fieldLabel}>Phone</label>
                  <IconInput icon={<Phone size={13} />}>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={e => update('contact_phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      style={{ ...inputStyle(), paddingLeft: 32 }}
                      onFocus={onFocus}
                      onBlur={e => onBlur(e)}
                    />
                  </IconInput>
                </div>
              </div>

              {/* ── Section: Risk Classification ── */}
              <SectionHeader title="Risk Classification" />
              <div style={{ marginBottom: 22 }}>
                <label style={fieldLabel}>Criticality Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {CRITICALITY_OPTIONS.map(opt => {
                    const active = formData.criticality_level === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('criticality_level', opt.value)}
                        style={{
                          padding: '12px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: `2px solid ${active ? opt.color : T.border}`,
                          background: active ? opt.bg : T.card,
                          transition: 'all 0.15s',
                          boxShadow: active ? `0 2px 10px ${opt.color}22` : 'none',
                        }}
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = opt.color + '80'; e.currentTarget.style.background = opt.bg; } }}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; } }}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: opt.color, margin: '0 auto 7px',
                          boxShadow: active ? `0 0 6px ${opt.color}80` : 'none',
                        }} />
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                          color: active ? opt.color : T.textSecondary, marginBottom: 3,
                          transition: 'color 0.15s',
                        }}>
                          {opt.label}
                        </div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 10, color: T.textFaint, lineHeight: 1.3,
                        }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Notes ── */}
              <div>
                <label style={fieldLabel}>
                  Notes{' '}
                  <span style={{ fontFamily: T.fontSans, fontWeight: 400, color: T.textFaint }}>(optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => update('notes', e.target.value)}
                  rows={3}
                  placeholder="Any additional context about this vendor..."
                  style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = '#A5B4FC'; }}
                  onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = T.border; }}
                />
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: `1px solid ${T.borderLight}`,
              background: T.bg,
              borderRadius: '0 0 18px 18px',
              position: 'sticky', bottom: 0,
            }}>
              {/* Criticality badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 11px', borderRadius: 100,
                background: crit.bg, border: `1px solid ${crit.border}`,
                transition: 'all 0.2s',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: crit.color }} />
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: crit.color }}>
                  {crit.label} Criticality
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={creating}
                  style={{
                    padding: '9px 18px', borderRadius: 9,
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                    background: T.card, color: T.textSecondary,
                    border: `1px solid ${T.border}`, cursor: 'pointer',
                    transition: 'all 0.13s', opacity: creating ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!creating) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = T.textPrimary; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 9,
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                    background: creating ? T.borderLight : T.accent,
                    color: creating ? T.textMuted : '#fff',
                    border: 'none', cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: creating ? 'none' : '0 2px 8px rgba(79,70,229,0.28)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!creating) {
                      e.currentTarget.style.background = '#4338CA';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,70,229,0.38)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!creating) {
                      e.currentTarget.style.background = T.accent;
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.28)';
                    }
                  }}
                >
                  {creating ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 13, height: 13,
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                      }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Create Vendor
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
