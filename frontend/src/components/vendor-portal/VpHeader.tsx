import { useState } from 'react';
import { Sun, Moon, Lock } from 'lucide-react';
import { T } from '../../tokens';
import { CsfLogo } from '../CsfLogo';
import { useTheme } from '../../hooks/useTheme';

interface StatusDistribution {
  compliant: number;
  partial: number;
  nonCompliant: number;
  notAssessed: number;
  notApplicable?: number;
}

interface VpHeaderProps {
  assessmentName: string;
  progressPct: number;
  assessedCount: number;
  totalCount: number;
  overallScore?: number;
  statusDistribution?: StatusDistribution;
}

function getProgressColor(pct: number): string {
  if (pct < 30) return T.danger;
  if (pct <= 70) return T.warning;
  return T.success;
}

export function VpHeader({ assessmentName, progressPct, overallScore, statusDistribution }: VpHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [hoverToggle, setHoverToggle] = useState(false);

  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const fillColor = getProgressColor(progressPct);
  const clampedPct = Math.max(0, Math.min(100, progressPct));

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      {/* Main bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          minHeight: 48,
        }}
      >
        {/* Left cluster */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
            flex: 1,
          }}
        >
          <CsfLogo size={24} />
          <span
            style={{
              fontFamily: T.fontSans,
              fontSize: 14,
              fontWeight: 600,
              color: T.textPrimary,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            CSF Compass
          </span>

          {/* Vertical divider */}
          <div
            style={{
              width: 1,
              height: 20,
              background: T.border,
              flexShrink: 0,
            }}
          />

          {/* Assessment name — truncated */}
          <span
            style={{
              fontFamily: T.fontSans,
              fontSize: 13,
              fontWeight: 500,
              color: T.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {assessmentName}
          </span>
        </div>

        {/* Right cluster */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            marginLeft: 16,
          }}
        >
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            onMouseEnter={() => setHoverToggle(true)}
            onMouseLeave={() => setHoverToggle(false)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: hoverToggle ? T.borderLight : 'transparent',
              cursor: 'pointer',
              color: T.textSecondary,
              transition: 'background 0.15s, color 0.15s',
              padding: 0,
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Score badge */}
          {overallScore !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 9px',
                borderRadius: 99,
                background: `${getProgressColor(overallScore)}12`,
                border: `1px solid ${getProgressColor(overallScore)}40`,
              }}
            >
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  color: getProgressColor(overallScore),
                  lineHeight: 1,
                }}
              >
                {overallScore}%
              </span>
              <span
                style={{
                  fontFamily: T.fontSans,
                  fontSize: 10,
                  fontWeight: 600,
                  color: getProgressColor(overallScore),
                  lineHeight: 1,
                }}
              >
                Score
              </span>
            </div>
          )}

          {/* Secure badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: 99,
              background: T.successLight,
              border: `1px solid ${T.successBorder}`,
            }}
          >
            <Lock size={10} style={{ color: T.success }} />
            <span
              style={{
                fontFamily: T.fontSans,
                fontSize: 11,
                fontWeight: 600,
                color: T.success,
                lineHeight: 1,
              }}
            >
              Secure
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 3,
          background: T.borderLight,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clampedPct}%`,
            background: fillColor,
            borderRadius: clampedPct < 100 ? '0 2px 2px 0' : 0,
            transition: 'width 0.4s ease, background 0.4s ease',
          }}
        />
      </div>

      {/* Status distribution bar */}
      {statusDistribution && (() => {
        const total = statusDistribution.compliant + statusDistribution.partial +
          statusDistribution.nonCompliant + statusDistribution.notAssessed +
          (statusDistribution.notApplicable || 0);
        if (total === 0) return null;
        const segments = [
          { value: statusDistribution.compliant, color: T.success },
          { value: statusDistribution.partial, color: T.warning },
          { value: statusDistribution.nonCompliant, color: T.danger },
          { value: statusDistribution.notAssessed, color: T.borderLight },
          { value: statusDistribution.notApplicable || 0, color: T.textFaint },
        ].filter(s => s.value > 0);
        return (
          <div
            style={{
              width: '100%',
              height: 2,
              display: 'flex',
            }}
          >
            {segments.map((seg, i) => (
              <div
                key={i}
                style={{
                  height: '100%',
                  width: `${(seg.value / total) * 100}%`,
                  background: seg.color,
                  transition: 'width 0.4s ease',
                }}
              />
            ))}
          </div>
        );
      })()}
    </header>
  );
}
