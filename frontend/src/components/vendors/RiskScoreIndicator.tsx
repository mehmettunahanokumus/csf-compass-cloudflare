import { useEffect, useState } from 'react';

interface RiskScoreIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { dimension: 48, strokeWidth: 4, fontSize: 14 },
  md: { dimension: 64, strokeWidth: 5, fontSize: 18 },
  lg: { dimension: 96, strokeWidth: 6, fontSize: 28 },
};

function getScoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function RiskScoreIndicator({ score, size = 'md' }: RiskScoreIndicatorProps) {
  const [animatedOffset, setAnimatedOffset] = useState<number | null>(null);
  const config = sizeMap[size];
  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;

  useEffect(() => {
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
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border, #e2e8f0)"
          strokeWidth={config.strokeWidth}
        />
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
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-1, #1e293b)"
            fontSize={config.fontSize}
            fontWeight={700}
          >
            {Math.round(score)}
          </text>
        </g>
      </svg>
    </div>
  );
}
