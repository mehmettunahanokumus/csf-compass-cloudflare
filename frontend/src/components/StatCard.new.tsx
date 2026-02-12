/**
 * StatCard - Rebuilt from scratch
 * Big mono number, colored trend, decorative sparkline SVG
 */

import { useState } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percentage: number;
    from: number;
  };
  sparklineColor?: string;
  onClick?: () => void;
}

export default function StatCard({ label, value, trend, sparklineColor = 'var(--accent)', onClick }: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Color for trend
  const trendColor =
    trend?.direction === 'up' ? 'var(--green-text)' :
    trend?.direction === 'down' ? 'var(--red-text)' :
    'var(--text-4)';

  const trendArrow =
    trend?.direction === 'up' ? '↑' :
    trend?.direction === 'down' ? '↓' :
    '—';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--card)',
        border: isHovered ? '1px solid var(--border-hover)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 200ms ease',
      }}
    >
      {/* Label */}
      <div
        style={{
          color: 'var(--text-3)',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>

      {/* Value */}
      <div
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-mono)',
          fontSize: '32px',
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {/* Trend */}
      {trend && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            marginTop: '10px',
          }}
        >
          <span style={{ color: trendColor }}>
            {trendArrow} {trend.percentage.toFixed(1)}%
          </span>
          {' '}
          <span style={{ color: 'var(--text-3)' }}>
            From {trend.from}
          </span>
        </div>
      )}

      {/* Mini sparkline (decorative) */}
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '55%',
          height: '45px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      >
        <path
          d="M0 35 Q15 20 30 28 T60 15 T100 25 V40 H0 Z"
          fill={sparklineColor}
          style={{ opacity: 0.15 }}
        />
      </svg>
    </div>
  );
}
