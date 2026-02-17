import { User, Mail, Building2, Hash, Shield, Bell, Key, Monitor, Palette } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentLight: 'rgba(99,102,241,0.08)',
  accentBorder: 'rgba(99,102,241,0.2)',
  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.08)',
  warningBorder: 'rgba(217,119,6,0.2)',
  success: '#16A34A',
  successLight: 'rgba(22,163,74,0.08)',
  fontSans: 'Manrope, sans-serif',
  fontMono: 'JetBrains Mono, monospace',
  fontDisplay: 'Barlow Condensed, sans-serif',
};

const card: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const sectionLabel: React.CSSProperties = {
  fontFamily: T.fontSans,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: T.textMuted,
};

const upcomingFeatures = [
  { icon: Palette, label: 'Theme & display preferences', color: '#8B5CF6' },
  { icon: Bell, label: 'Email and notification settings', color: '#D97706' },
  { icon: Shield, label: 'Two-factor authentication (2FA)', color: '#16A34A' },
  { icon: Key, label: 'API key management', color: '#0EA5E9' },
  { icon: Monitor, label: 'Session history and active devices', color: '#6366F1' },
  { icon: User, label: 'Avatar and display name customization', color: '#EC4899' },
];

export default function Profile() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
          Profile
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div style={{ ...card, padding: 32 }}>
        {/* Avatar + Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: T.accentLight, border: `2px solid ${T.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, color: T.accent,
            }}>D</span>
          </div>
          <h2 style={{ fontFamily: T.fontSans, fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px' }}>
            Demo User
          </h2>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: T.successLight, border: '1px solid rgba(22,163,74,0.2)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.success }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.success }}>Administrator</span>
          </div>
        </div>

        {/* ID badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          {[
            { icon: Hash, label: 'User ID', value: 'demo-user-456' },
            { icon: Building2, label: 'Org ID', value: 'demo-org-123' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', background: '#F8FAFC',
                border: `1px solid ${T.border}`, borderRadius: 8,
              }}>
                <Icon size={12} style={{ color: T.textMuted }} />
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSecondary }}>{item.value}</span>
              </div>
            );
          })}
        </div>

        {/* Profile fields grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, maxWidth: 540, margin: '0 auto',
        }}>
          {[
            { icon: User, label: 'Full Name', value: 'Demo User' },
            { icon: Mail, label: 'Email Address', value: 'demo@example.com' },
            { icon: Building2, label: 'Organization', value: 'Demo Organization' },
            { icon: Hash, label: 'Role', value: 'Administrator' },
          ].map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} style={{
                padding: '14px 16px', background: '#F8FAFC',
                border: `1px solid ${T.border}`, borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={12} style={{ color: T.textMuted }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted }}>
                    {field.label}
                  </span>
                </div>
                <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0 }}>
                  {field.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div style={{
        ...card,
        padding: '16px 20px',
        background: T.warningLight,
        borderColor: T.warningBorder,
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: T.warningLight, border: `1px solid ${T.warningBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <User size={18} style={{ color: T.warning }} />
        </div>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
            Profile Settings Coming Soon
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '4px 0 0', lineHeight: 1.6 }}>
            User profile management, preferences, and notification settings will be available in a future update.
          </p>
        </div>
      </div>

      {/* Upcoming Features */}
      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={sectionLabel}>Upcoming Profile Features</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {upcomingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: '#F8FAFC',
                border: `1px solid ${T.border}`, borderRadius: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${feature.color}12`, border: `1px solid ${feature.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: feature.color }} />
                </div>
                <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
