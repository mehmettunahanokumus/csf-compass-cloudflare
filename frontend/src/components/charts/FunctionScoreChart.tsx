import { useEffect, useState } from 'react';

interface FunctionScore {
  code: string;
  name: string;
  score: number;
  compliant?: number;
  partial?: number;
  nonCompliant?: number;
}

interface FunctionScoreChartProps {
  functions: FunctionScore[];
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function BarRow({ fn, animate }: { fn: FunctionScore; animate: boolean }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (animate) {
      const frame = requestAnimationFrame(() => {
        setWidth(fn.score);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [animate, fn.score]);

  const color = getScoreColor(fn.score);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {/* Code badge */}
      <div
        style={{
          background: '#102a43',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: 4,
          minWidth: 36,
          textAlign: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {fn.code}
      </div>

      {/* Name + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: 'var(--text-1, #1e293b)',
              fontWeight: 500,
            }}
          >
            {fn.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-1, #1e293b)',
              }}
            >
              {Math.round(fn.score)}%
            </span>
            {(fn.compliant !== undefined || fn.partial !== undefined || fn.nonCompliant !== undefined) && (
              <span style={{ fontSize: 11, color: 'var(--text-2, #64748b)' }}>
                {fn.compliant ?? 0}/{fn.partial ?? 0}/{fn.nonCompliant ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: 'var(--border, #e2e8f0)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 4,
              background: color,
              width: `${width}%`,
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function FunctionScoreChart({ functions }: FunctionScoreChartProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {functions.map((fn) => (
        <BarRow key={fn.code} fn={fn} animate={animate} />
      ))}
    </div>
  );
}
