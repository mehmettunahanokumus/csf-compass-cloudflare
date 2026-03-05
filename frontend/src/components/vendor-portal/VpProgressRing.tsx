import { T } from '../../tokens';

interface VpProgressRingProps {
  percentage: number;
  assessed: number;
  total: number;
  size?: number;
}

function getRingColor(pct: number): string {
  if (pct < 30) return T.danger;
  if (pct <= 70) return T.warning;
  return T.success;
}

export function VpProgressRing({
  percentage,
  assessed,
  total,
  size = 100,
}: VpProgressRingProps) {
  const strokeWidth = 7;
  const radius = 44; // fits in 100x100 viewBox with stroke
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const dashoffset = circumference * (1 - clampedPct / 100);
  const color = getRingColor(clampedPct);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={T.borderLight}
          strokeWidth={strokeWidth}
          opacity={0.6}
        />
        {/* Progress arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>

      {/* Center percentage — positioned over the SVG */}
      <div
        style={{
          marginTop: -size - 6, // pull up over the SVG
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontSize: size * 0.28,
            fontWeight: 700,
            color,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            transition: 'color 0.4s ease',
          }}
        >
          {Math.round(clampedPct)}%
        </span>
      </div>

      {/* Label below */}
      <span
        style={{
          fontFamily: T.fontSans,
          fontSize: 11,
          color: T.textMuted,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {assessed} / {total} degerlendirildi
      </span>
    </div>
  );
}
