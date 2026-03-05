import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { T } from '../../tokens';
import type { AssessmentItem } from '../../types';

interface VpCategorySectionProps {
  categoryId: string;
  categoryName: string;
  categoryNameTr?: string;
  functionColor: string;
  items: AssessmentItem[];
  assessedCount: number;
  totalCount: number;
  defaultExpanded?: boolean;
  renderItem: (item: AssessmentItem) => React.ReactNode;
}

export default function VpCategorySection({
  categoryId,
  categoryName,
  categoryNameTr,
  functionColor,
  items,
  assessedCount,
  totalCount,
  defaultExpanded = true,
  renderItem,
}: VpCategorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [headerHovered, setHeaderHovered] = useState(false);
  const isComplete = assessedCount === totalCount && totalCount > 0;

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '10px 12px',
          background: headerHovered ? T.bg : 'transparent',
          border: 'none',
          borderLeft: `3px solid ${functionColor}`,
          cursor: 'pointer',
          gap: 10,
          textAlign: 'left',
          transition: 'background 0.15s',
          borderRadius: 0,
        }}
      >
        {/* Category ID badge */}
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 10,
            fontWeight: 700,
            color: functionColor,
            background: T.accentLight,
            borderRadius: 4,
            padding: '2px 6px',
            letterSpacing: '0.03em',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          {categoryId}
        </span>

        {/* Names */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: T.fontSans,
              fontSize: 13,
              fontWeight: 600,
              color: T.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {categoryName}
          </span>
          {categoryNameTr && (
            <span
              style={{
                fontFamily: T.fontSans,
                fontSize: 11,
                fontStyle: 'italic',
                color: T.textMuted,
                marginLeft: 8,
                lineHeight: 1.3,
              }}
            >
              {categoryNameTr}
            </span>
          )}
        </div>

        {/* Progress pill */}
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            fontWeight: 600,
            color: isComplete ? T.success : T.textMuted,
            background: isComplete ? T.successLight : T.bg,
            border: `1px solid ${isComplete ? T.successBorder : T.borderLight}`,
            borderRadius: 10,
            padding: '2px 8px',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          {assessedCount}/{totalCount}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={14}
          style={{
            color: T.textMuted,
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Content */}
      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '6px 0',
          }}
        >
          {items.map((item) => (
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
