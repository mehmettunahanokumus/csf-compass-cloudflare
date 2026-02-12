/**
 * AssessmentCard - Rebuilt from scratch
 * For Assessments page grid: title, badge, description, progress, score, date
 */

import { useState } from 'react';

interface AssessmentCardProps {
  title: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed';
  score: number;
  createdDate: string;
  onClick: () => void;
}

export default function AssessmentCard({
  title,
  description,
  status,
  score,
  createdDate,
  onClick,
}: AssessmentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Status badge
  const statusBadge =
    status === 'draft'
      ? { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'draft' }
      : status === 'in_progress'
      ? { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', label: 'in progress' }
      : { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'completed' };

  // Score color
  const scoreColor =
    score === 0 ? 'var(--text-4)' :
    score < 41 ? 'var(--red-text)' :
    score < 71 ? 'var(--orange-text)' :
    'var(--green-text)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--card)',
        border: isHovered ? '1px solid var(--border-hover)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '180px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
        {/* Title */}
        <div
          style={{
            color: 'var(--text-1)',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 1.4,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Badge */}
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
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            color: 'var(--text-2)',
            fontSize: '12px',
            lineHeight: 1.5,
            marginTop: '6px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Progress bar */}
      <div style={{ paddingTop: '16px' }}>
        <div
          style={{
            width: '100%',
            height: '3px',
            borderRadius: '999px',
            background: 'var(--border)',
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
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
        {/* Score */}
        <div>
          <div
            style={{
              color: 'var(--text-4)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '2px',
            }}
          >
            Score
          </div>
          <div
            style={{
              color: scoreColor,
              fontFamily: 'var(--font-mono)',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {score.toFixed(1)}%
          </div>
        </div>

        {/* Created */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: 'var(--text-4)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '2px',
            }}
          >
            Created
          </div>
          <div
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
          >
            {createdDate}
          </div>
        </div>
      </div>
    </div>
  );
}
