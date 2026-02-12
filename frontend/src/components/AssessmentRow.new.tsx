/**
 * AssessmentRow - Rebuilt from scratch
 * For Dashboard: status dot, title, meta, score bar, status badge, chevron
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface AssessmentRowProps {
  title: string;
  type: 'vendor' | 'organization';
  status: 'draft' | 'in_progress' | 'completed';
  date: string;
  relativeTime: string;
  score: number | null;
  onClick: () => void;
}

export default function AssessmentRow({
  title,
  type,
  status,
  date,
  relativeTime,
  score,
  onClick,
}: AssessmentRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Status dot color
  const dotColor =
    status === 'draft' ? 'var(--gray)' :
    status === 'in_progress' ? 'var(--blue)' :
    'var(--green)';

  // Type badge
  const typeBadge =
    type === 'vendor'
      ? { bg: 'var(--purple-subtle)', color: 'var(--purple-text)', label: 'Vendor' }
      : { bg: 'var(--accent-subtle)', color: 'var(--accent)', label: 'Self' };

  // Status badge
  const statusBadge =
    status === 'draft'
      ? { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'draft' }
      : status === 'in_progress'
      ? { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', label: 'in progress' }
      : { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'completed' };

  // Score color
  const scoreColor =
    score === null || score === 0 ? 'var(--text-4)' :
    score < 41 ? 'var(--red-text)' :
    score < 71 ? 'var(--orange-text)' :
    'var(--green-text)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: isHovered ? 'var(--accent-subtle)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
      />

      {/* Title block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div
          style={{
            color: 'var(--text-1)',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          {/* Type badge */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: '4px',
              background: typeBadge.bg,
              color: typeBadge.color,
            }}
          >
            {typeBadge.label}
          </span>

          {/* Date */}
          <span
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            {date}
          </span>

          {/* Separator */}
          <span style={{ color: 'var(--text-4)' }}>•</span>

          {/* Relative time */}
          <span
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            {relativeTime}
          </span>
        </div>
      </div>

      {/* Score block */}
      {score !== null && (
        <div style={{ flexShrink: 0, textAlign: 'right', width: '100px' }}>
          {/* Progress bar */}
          <div
            style={{
              width: '64px',
              height: '3px',
              borderRadius: '999px',
              background: 'var(--border)',
              marginBottom: '2px',
              marginLeft: 'auto',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: '100%',
                background: scoreColor,
                minWidth: score > 0 ? '3px' : '0',
              }}
            />
          </div>

          {/* Number */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 600,
              color: scoreColor,
            }}
          >
            {score.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Status badge */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 500,
          padding: '3px 8px',
          borderRadius: '6px',
          background: statusBadge.bg,
          color: statusBadge.color,
          flexShrink: 0,
        }}
      >
        {statusBadge.label}
      </div>

      {/* Chevron */}
      <ChevronRight
        size={16}
        style={{
          color: 'var(--text-4)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 120ms ease',
          flexShrink: 0,
        }}
      />
    </div>
  );
}
