import React from 'react';
import type { CriticalityTier } from '../types';

interface TierBadgeProps {
  tier: CriticalityTier;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const TIER_CONFIG: Record<CriticalityTier, { label: string; bg: string; color: string; border: string }> = {
  low: {
    label: 'Low',
    bg: 'rgba(34,197,94,0.1)',
    color: '#22C55E',
    border: 'rgba(34,197,94,0.25)',
  },
  medium: {
    label: 'Medium',
    bg: 'rgba(234,179,8,0.1)',
    color: '#EAB308',
    border: 'rgba(234,179,8,0.25)',
  },
  high: {
    label: 'High',
    bg: 'rgba(249,115,22,0.1)',
    color: '#F97316',
    border: 'rgba(249,115,22,0.25)',
  },
  critical: {
    label: 'Critical',
    bg: 'rgba(239,68,68,0.1)',
    color: '#EF4444',
    border: 'rgba(239,68,68,0.25)',
  },
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', showLabel = true }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.medium;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      borderRadius: 20,
      fontSize: size === 'sm' ? 9 : 10,
      fontWeight: 700,
      fontFamily: 'JetBrains Mono, monospace',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
      whiteSpace: 'nowrap',
    }}>
      {showLabel ? config.label : tier.charAt(0).toUpperCase()}
    </span>
  );
};
