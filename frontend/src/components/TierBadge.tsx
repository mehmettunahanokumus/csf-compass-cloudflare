import React from 'react';
import type { CriticalityTier } from '../types';

interface TierBadgeProps {
  tier: CriticalityTier;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const TIER_CONFIG: Record<CriticalityTier, { label: string; bg: string; text: string; ring: string }> = {
  low: {
    label: 'Low',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    ring: 'ring-emerald-600/20 dark:ring-emerald-400/20',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-amber-600/20 dark:ring-amber-400/20',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-400',
    ring: 'ring-orange-600/20 dark:ring-orange-400/20',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    ring: 'ring-red-600/20 dark:ring-red-400/20',
  },
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', showLabel = true }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.medium;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ring-1 ring-inset ${sizeClasses} ${config.bg} ${config.text} ${config.ring}`}
    >
      {showLabel ? config.label : tier.charAt(0).toUpperCase()}
    </span>
  );
};
