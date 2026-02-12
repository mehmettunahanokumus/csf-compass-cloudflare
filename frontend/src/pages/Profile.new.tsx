/**
 * User Profile Page (Placeholder)
 * Future: User profile, preferences, notifications
 */

import { User } from 'lucide-react';

export default function Profile() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-1)',
            marginBottom: '4px',
          }}
        >
          Profile
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontFamily: 'var(--font-ui)' }}>
          Manage your profile and preferences
        </p>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '48px 24px',
          boxShadow: 'var(--shadow-xs)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'var(--accent-subtle)',
            padding: '16px',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={32} style={{ color: 'var(--accent)' }} />
        </div>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-1)',
            marginBottom: '8px',
          }}
        >
          Profile Settings Coming Soon
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-3)',
            maxWidth: '448px',
            margin: '0 auto',
            lineHeight: '1.5',
          }}
        >
          Update your profile information, change password, manage notifications, and set preferences.
        </p>
      </div>
    </div>
  );
}
