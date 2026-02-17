import type React from 'react';

/**
 * MERIDIAN Design Tokens
 * Uses CSS custom properties so light/dark theme switching is instant
 * (no re-render needed — the browser resolves var() at paint time).
 *
 * Light values defined in index.css :root
 * Dark  values defined in index.css html[data-theme="dark"]
 */
export const T = {
  card:          'var(--t-card)',
  bg:            'var(--t-bg)',
  border:        'var(--t-border)',
  borderLight:   'var(--t-border-light)',
  textPrimary:   'var(--t-text-primary)',
  textSecondary: 'var(--t-text-secondary)',
  textMuted:     'var(--t-text-muted)',
  textFaint:     'var(--t-text-faint)',
  accent:        'var(--t-accent)',
  accentLight:   'var(--t-accent-light)',
  accentBorder:  'var(--t-accent-border)',
  success:       'var(--t-success)',
  successLight:  'var(--t-success-light)',
  successBorder: 'var(--t-success-border)',
  warning:       'var(--t-warning)',
  warningLight:  'var(--t-warning-light)',
  warningBorder: 'var(--t-warning-border)',
  danger:        'var(--t-danger)',
  dangerLight:   'var(--t-danger-light)',
  dangerBorder:  'var(--t-danger-border)',
  sky:           'var(--t-sky)',
  skyLight:      'var(--t-sky-light)',
  fontSans:      'Manrope, sans-serif',
  fontMono:      'JetBrains Mono, monospace',
  fontDisplay:   'Barlow Condensed, sans-serif',
} as const;

/** Shared card surface style */
export const card: React.CSSProperties = {
  background:   T.card,
  border:       `1px solid ${T.border}`,
  borderRadius: 12,
  boxShadow:    'var(--t-shadow)',
};

/** Uppercase section label */
export const sectionLabel: React.CSSProperties = {
  fontFamily:    T.fontSans,
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase' as const,
  color:         T.textMuted,
};

/** Form field label */
export const fieldLabel: React.CSSProperties = {
  fontFamily:   T.fontSans,
  fontSize:     11,
  fontWeight:   700,
  color:        T.textSecondary,
  display:      'block',
  marginBottom: 6,
};

/** Form input style factory */
export const inputStyle = (hasError = false): React.CSSProperties => ({
  width:      '100%',
  padding:    '9px 12px',
  borderRadius: 8,
  border:     `1px solid ${hasError ? T.dangerBorder : T.border}`,
  outline:    'none',
  fontFamily: T.fontSans,
  fontSize:   13,
  color:      T.textPrimary,
  background: T.card,
  transition: 'border-color 0.15s',
  boxSizing:  'border-box' as const,
});
