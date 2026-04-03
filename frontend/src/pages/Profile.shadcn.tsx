import { User, Mail, Building2, Hash, Shield, Bell, Key, Monitor, Palette, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { T, card, sectionLabel } from '../tokens';

const upcomingFeatures = [
  { icon: Palette, label: 'Theme & display preferences', color: '#8B5CF6' },
  { icon: Bell, label: 'Email and notification settings', color: '#D97706' },
  { icon: Shield, label: 'Two-factor authentication (2FA)', color: '#16A34A' },
  { icon: Key, label: 'API key management', color: '#0EA5E9' },
  { icon: Monitor, label: 'Session history and active devices', color: '#6366F1' },
  { icon: User, label: 'Avatar and display name customization', color: '#EC4899' },
];

export default function Profile() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.full_name || user?.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
            Profile
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
            Manage your account settings and preferences
          </p>
        </div>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', background: T.dangerLight, color: T.danger,
          border: `1px solid ${T.dangerBorder}`, borderRadius: 8,
          fontSize: 13, fontWeight: 600, fontFamily: T.fontSans, cursor: 'pointer',
        }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {/* Profile Card */}
      <div style={{ ...card, padding: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: T.accentLight, border: `2px solid ${T.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, color: T.accent }}>
              {initials}
            </span>
          </div>
          <h2 style={{ fontFamily: T.fontSans, fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px' }}>
            {user?.full_name || 'User'}
          </h2>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: T.successLight, border: '1px solid rgba(22,163,74,0.2)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.success }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.success }}>
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'viewer' ? 'Viewer' : 'Member'}
            </span>
          </div>
        </div>

        {/* Profile fields grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, maxWidth: 540, margin: '0 auto',
        }}>
          {[
            { icon: User, label: 'Full Name', value: user?.full_name || 'N/A' },
            { icon: Mail, label: 'Email Address', value: user?.email || 'N/A' },
            { icon: Building2, label: 'Organization', value: organization?.name || 'N/A' },
            { icon: Hash, label: 'Role', value: user?.role === 'admin' ? 'Administrator' : user?.role === 'viewer' ? 'Viewer' : 'Member' },
          ].map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} style={{
                padding: '14px 16px', background: '#F8FAFC',
                border: `1px solid ${T.border}`, borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={12} style={{ color: T.textMuted }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: T.textMuted }}>
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
