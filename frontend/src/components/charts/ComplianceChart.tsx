import { useEffect, useState } from 'react';

interface ComplianceChartProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeMap = {
  sm: { dimension: 100, strokeWidth: 8, fontSize: 24, labelSize: 10 },
  md: { dimension: 150, strokeWidth: 10, fontSize: 36, labelSize: 12 },
  lg: { dimension: 200, strokeWidth: 12, fontSize: 48, labelSize: 14 },
};

function getScoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function ComplianceChart({
  score,
  size = 'md',
  showLabel = true,
}: ComplianceChartProps) {
  const [animatedOffset, setAnimatedOffset] = useState<number | null>(null);
  const config = sizeMap[size];
  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    // Start fully hidden, then animate to target
    setAnimatedOffset(circumference);
    const frame = requestAnimationFrame(() => {
      setAnimatedOffset(targetOffset);
    });
    return () => cancelAnimationFrame(frame);
  }, [score, circumference, targetOffset]);

  const color = getScoreColor(score);
  const center = config.dimension / 2;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={config.dimension}
        height={config.dimension}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border, #e2e8f0)"
          strokeWidth={config.strokeWidth}
        />
        {/* Foreground circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset ?? circumference}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Center text (rotated back) */}
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          <text
            x={center}
            y={showLabel ? center - 4 : center}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-1, #1e293b)"
            fontSize={config.fontSize}
            fontWeight={700}
          >
            {Math.round(score)}
          </text>
          {showLabel && (
            <text
              x={center}
              y={center + config.fontSize * 0.55}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-2, #64748b)"
              fontSize={config.labelSize}
              fontWeight={500}
            >
              Score
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
