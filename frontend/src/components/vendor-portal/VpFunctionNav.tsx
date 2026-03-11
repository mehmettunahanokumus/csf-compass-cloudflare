import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { T } from '../../tokens';
import type { CsfFunction, AssessmentItem } from '../../types';
import { VpProgressRing } from './VpProgressRing';

interface VpFunctionNavProps {
  functions: CsfFunction[];
  items?: AssessmentItem[];
  functionStats?: Record<string, { assessed: number; total: number }>;
  selectedFunctionId: string | null;
  onSelectFunction: (id: string) => void;
  onNextUnanswered: () => void;
  isMobile?: boolean;
}

/** Extract code like "GV" from "Govern (GV)" */
function extractCode(name: string): string {
  const m = name.match(/\(([A-Z]{2})\)/);
  return m ? m[1] : name.slice(0, 2).toUpperCase();
}

/** Strip code portion to get display name */
function displayName(fn: CsfFunction): string {
  if (fn.name_tr) return fn.name_tr;
  return fn.name.replace(/\s*\([A-Z]{2}\)\s*/, '').trim();
}

export default function VpFunctionNav({
  functions,
  items,
  functionStats: externalStats,
  selectedFunctionId,
  onSelectFunction,
  onNextUnanswered,
  isMobile = false,
}: VpFunctionNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use external stats if provided, otherwise compute from items
  const stats = useMemo(() => {
    if (externalStats) return externalStats;

    const map: Record<string, { assessed: number; total: number }> = {};
    for (const fn of functions) {
      map[fn.id] = { assessed: 0, total: 0 };
    }
    if (items) {
      for (const item of items) {
        const fid = item.function?.id;
        if (fid && map[fid]) {
          map[fid].total++;
          if (item.status !== 'not_assessed') {
            map[fid].assessed++;
          }
        }
      }
    }
    return map;
  }, [functions, items, externalStats]);

  const overallAssessed = useMemo(() => {
    let assessed = 0;
    let total = 0;
    for (const s of Object.values(stats)) {
      assessed += s.assessed;
      total += s.total;
    }
    return { assessed, total };
  }, [stats]);

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          padding: '0 4px',
          gap: 2,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {functions.map((fn) => {
          const code = extractCode(fn.name);
          const s = stats[fn.id] || { assessed: 0, total: 0 };
          const selected = fn.id === selectedFunctionId;
          return (
            <button
              key={fn.id}
              onClick={() => onSelectFunction(fn.id)}
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: selected ? `2px solid ${T.accent}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: selected ? T.accent : T.textMuted,
                  letterSpacing: '0.03em',
                }}
              >
                {code}
              </span>
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 9,
                  fontWeight: 600,
                  color: s.assessed === s.total && s.total > 0 ? T.success : T.textFaint,
                  background: s.assessed === s.total && s.total > 0 ? T.successLight : T.bg,
                  borderRadius: 8,
                  padding: '2px 5px',
                  lineHeight: 1,
                }}
              >
                {s.assessed}/{s.total}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop sidebar
  return (
    <nav
      style={{
        width: 240,
        minWidth: 240,
        background: T.card,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Function list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {functions.map((fn) => {
          const code = extractCode(fn.name);
          const name = displayName(fn);
          const s = stats[fn.id] || { assessed: 0, total: 0 };
          const pct = s.total > 0 ? (s.assessed / s.total) * 100 : 0;
          const selected = fn.id === selectedFunctionId;
          const hovered = hoveredId === fn.id;

          return (
            <button
              key={fn.id}
              onClick={() => onSelectFunction(fn.id)}
              onMouseEnter={() => setHoveredId(fn.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                padding: '10px 14px 10px 0',
                background: selected ? T.accentLight : hovered ? T.bg : 'transparent',
                border: 'none',
                borderLeft: selected ? `3px solid ${T.accent}` : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, border-color 0.15s',
                paddingLeft: 12,
                gap: 4,
              }}
            >
              {/* Top row: code + count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.accent,
                    letterSpacing: '0.04em',
                  }}
                >
                  {code}
                </span>
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    color: T.textMuted,
                    lineHeight: 1,
                  }}
                >
                  {s.assessed}/{s.total}
                </span>
              </div>

              {/* Name */}
              <span
                style={{
                  fontFamily: T.fontSans,
                  fontSize: 12,
                  fontWeight: selected ? 700 : 500,
                  color: T.textPrimary,
                  lineHeight: 1.3,
                }}
              >
                {name}
              </span>

              {/* Mini progress bar */}
              <div
                style={{
                  width: '100%',
                  height: 3,
                  borderRadius: 2,
                  background: T.border,
                  marginTop: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: pct === 100 ? T.success : T.accent,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom: progress ring + next button */}
      <div
        style={{
          borderTop: `1px solid ${T.border}`,
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <VpProgressRing
          percentage={overallAssessed.total > 0 ? Math.round((overallAssessed.assessed / overallAssessed.total) * 100) : 0}
          assessed={overallAssessed.assessed}
          total={overallAssessed.total}
          size={80}
        />
        <button
          onClick={onNextUnanswered}
          style={{
            width: '100%',
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'transparent',
            border: `1px solid ${T.accentBorder}`,
            borderRadius: 8,
            color: T.accent,
            fontFamily: T.fontSans,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.accentLight;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          Sonraki cevaplanmamis
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
