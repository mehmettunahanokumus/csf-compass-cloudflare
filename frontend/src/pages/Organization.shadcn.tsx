import { useState, useEffect, useRef } from 'react';
import {
  Building2, Users, Shield, Puzzle, Bell, CreditCard,
  Upload, X, Check, Palette,
} from 'lucide-react';
import { T, card, sectionLabel } from '../tokens';

const LS_LOGO  = 'csf-org-logo';
const LS_NAME  = 'csf-org-name';
const LS_COLOR = 'csf-org-color';

const DEFAULT_COLOR = '#6366F1';
const DEFAULT_NAME  = 'CSF Compass';

const comingSoonModules = [
  {
    icon: Users, title: 'Team Members',
    description: 'Invite team members, manage user accounts, view activity logs, and track assessment contributions',
    color: '#0EA5E9', bg: 'rgba(14,165,233,0.07)', bdr: 'rgba(14,165,233,0.18)',
  },
  {
    icon: Shield, title: 'Roles & Permissions',
    description: 'Define custom roles (Admin, Assessor, Viewer, Auditor) with granular permissions for assessment access',
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)', bdr: 'rgba(139,92,246,0.18)',
  },
  {
    icon: Puzzle, title: 'Integrations',
    description: 'Connect to GRC platforms, SIEM tools, ticketing systems (Jira, ServiceNow), and cloud providers',
    color: '#16A34A', bg: 'rgba(22,163,74,0.07)', bdr: 'rgba(22,163,74,0.18)',
  },
  {
    icon: Bell, title: 'Notifications & Alerts',
    description: 'Configure email, Slack, and in-app notifications for assessment updates, deadlines, and risk changes',
    color: '#D97706', bg: 'rgba(217,119,6,0.07)', bdr: 'rgba(217,119,6,0.18)',
  },
  {
    icon: CreditCard, title: 'Billing & Subscription',
    description: 'Manage subscription plan, payment methods, usage limits, and view invoices and billing history',
    color: '#EC4899', bg: 'rgba(236,72,153,0.07)', bdr: 'rgba(236,72,153,0.18)',
  },
];

export default function Organization() {
  const [orgName, setOrgName]         = useState(() => localStorage.getItem(LS_NAME) || DEFAULT_NAME);
  const [logoPreview, setLogoPreview] = useState<string | null>(() => localStorage.getItem(LS_LOGO));
  const [primaryColor, setPrimaryColor] = useState(() => localStorage.getItem(LS_COLOR) || DEFAULT_COLOR);
  const [isDragging, setIsDragging]   = useState(false);
  const [logoError, setLogoError]     = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const savedTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply stored color on mount
  useEffect(() => {
    const c = localStorage.getItem(LS_COLOR);
    if (c) document.documentElement.style.setProperty('--t-accent', c);
  }, []);

  const handleFileSelect = (file: File) => {
    setLogoError(null);
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setLogoError('Please use PNG, JPG, or SVG format.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File size must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    localStorage.removeItem(LS_LOGO);
    window.dispatchEvent(new Event('csf-branding-change'));
  };

  const handleSave = () => {
    // Persist to localStorage
    if (logoPreview) localStorage.setItem(LS_LOGO, logoPreview);
    else localStorage.removeItem(LS_LOGO);
    localStorage.setItem(LS_NAME, orgName.trim() || DEFAULT_NAME);
    localStorage.setItem(LS_COLOR, primaryColor);

    // Apply color immediately
    document.documentElement.style.setProperty('--t-accent', primaryColor);

    // Notify sidebar
    window.dispatchEvent(new Event('csf-branding-change'));

    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 3000);
  };

  const resetColor = () => {
    setPrimaryColor(DEFAULT_COLOR);
    document.documentElement.style.setProperty('--t-accent', DEFAULT_COLOR);
    localStorage.setItem(LS_COLOR, DEFAULT_COLOR);
  };

  // ── Shared styles ───────────────────────────────────
  const fieldLabel: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textMuted,
    display: 'block', marginBottom: 6,
  };

  const textInput: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '9px 12px',
    fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary,
    outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
          Organization Settings
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
          Manage branding, team members, and integrations
        </p>
      </div>

      {/* ── Branding Section ────────────────────────── */}
      <div style={{ ...card, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={sectionLabel}>Corporate Identity & Branding</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

          {/* Left column: Logo */}
          <div>
            <label style={fieldLabel}>Organization Logo</label>

            {/* Preview or upload zone */}
            {logoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 10,
                  border: `1px solid ${T.border}`, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src={logoPreview}
                    alt="Organization logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <button
                  onClick={removeLogo}
                  title="Remove logo"
                  style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#0F172A', border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: T.textMuted,
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'transparent', border: `1px solid ${T.border}`,
                      borderRadius: 6, padding: '5px 12px',
                      fontFamily: T.fontSans, fontSize: 12, color: T.textMuted,
                      cursor: 'pointer',
                    }}
                  >
                    Change Logo
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? T.accent : T.border}`,
                  borderRadius: 10, padding: '32px 20px',
                  textAlign: 'center', cursor: 'pointer',
                  background: isDragging ? T.accentLight : 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = T.accent;
                  (e.currentTarget as HTMLDivElement).style.background = T.accentLight;
                }}
                onMouseLeave={e => {
                  if (!isDragging) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentLight, border: `1px solid ${T.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Upload size={18} style={{ color: T.accent }} />
                </div>
                <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
                  Drop your logo here or{' '}
                  <span style={{ color: T.accent, textDecoration: 'underline' }}>click to browse</span>
                </p>
                <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, margin: '6px 0 0' }}>
                  PNG, JPG, SVG · Max 2 MB
                </p>
              </div>
            )}

            {logoError && (
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: '#F87171', marginTop: 8 }}>
                {logoError}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
            />

            <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, marginTop: 10, lineHeight: 1.5 }}>
              The logo appears in the sidebar header and exported reports.
            </p>
          </div>

          {/* Right column: Name + Color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={fieldLabel}>Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
                style={textInput}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = T.accent}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = T.border}
              />
              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, marginTop: 6 }}>
                Shown in the sidebar and report headers.
              </p>
            </div>

            <div>
              <label style={fieldLabel}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={13} style={{ color: T.textMuted }} />
                  Brand Accent Color
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => {
                      setPrimaryColor(e.target.value);
                      document.documentElement.style.setProperty('--t-accent', e.target.value);
                    }}
                    style={{
                      width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${T.border}`, padding: 2,
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                      setPrimaryColor(e.target.value);
                      if (e.target.value.length === 7) {
                        document.documentElement.style.setProperty('--t-accent', e.target.value);
                      }
                    }
                  }}
                  style={{ ...textInput, width: 110 }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = T.accent}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = T.border}
                />
                <button
                  onClick={resetColor}
                  style={{
                    background: 'transparent', border: `1px solid ${T.border}`,
                    borderRadius: 6, padding: '7px 12px',
                    fontFamily: T.fontSans, fontSize: 12, color: T.textMuted,
                    cursor: 'pointer', whiteSpace: 'nowrap' as const,
                  }}
                >
                  Reset
                </button>
              </div>
              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, marginTop: 6 }}>
                Applied as the accent color across the platform. Takes effect immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: saved ? T.success : T.accent,
              border: 'none', borderRadius: 8, padding: '9px 20px',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {saved ? <Check size={15} /> : <Upload size={15} />}
            {saved ? 'Saved!' : 'Save Branding'}
          </button>
          {saved && (
            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.success }}>
              Branding saved. Navigate away and back to see sidebar changes.
            </span>
          )}
        </div>
      </div>

      {/* ── Organization Profile preview card ───────── */}
      <div style={{ ...card, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
          background: T.accentLight, border: `1px solid ${T.accentBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoPreview
            ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <Building2 size={22} style={{ color: T.accent }} />
          }
        </div>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
            {orgName}
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, margin: '3px 0 0' }}>
            NIST CSF 2.0 Compliance Platform · Demo Organization
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: primaryColor, border: `1px solid ${T.border}` }} />
          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textFaint }}>{primaryColor}</span>
        </div>
      </div>

      {/* ── Coming Soon Modules ──────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={sectionLabel}>Settings Modules</span>
          <span style={{
            fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
            background: 'rgba(217,119,6,0.12)', color: '#FBBF24',
            textTransform: 'uppercase' as const, letterSpacing: '0.06em',
          }}>
            Coming Soon
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {comingSoonModules.map(section => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                style={{
                  ...card, padding: 20,
                  opacity: 0.7,
                  transition: 'box-shadow 0.14s, border-color 0.14s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = section.bdr;
                  (e.currentTarget as HTMLElement).style.opacity = '0.9';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLElement).style.opacity = '0.7';
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: section.bg, border: `1px solid ${section.bdr}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <Icon size={20} style={{ color: section.color }} />
                </div>
                <h3 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                  {section.title}
                </h3>
                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  {section.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
