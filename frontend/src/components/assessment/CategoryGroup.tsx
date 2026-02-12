import StatusSelector from './StatusSelector';

type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'na';

interface Subcategory {
  id: string;
  code: string;
  description: string;
  status: ComplianceStatus;
  evidenceCount: number;
}

interface CategoryGroupProps {
  code: string;
  name: string;
  subcategories: Subcategory[];
  onStatusChange?: (subcategoryId: string, status: ComplianceStatus) => void;
}

export default function CategoryGroup({
  code,
  name,
  subcategories,
  onStatusChange,
}: CategoryGroupProps) {
  return (
    <div
      style={{
        border: '1px solid var(--border, #e2e8f0)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--navy-100, #e2e8f0)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text-1, #1e293b)',
          }}
        >
          {code}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-1, #1e293b)',
          }}
        >
          {name}
        </span>
      </div>

      {/* Subcategory rows */}
      <div>
        {subcategories.map((sub, i) => (
          <div
            key={sub.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid var(--border, #e2e8f0)' : undefined,
            }}
          >
            {/* Code badge */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'var(--bg-2, #f1f5f9)',
                color: 'var(--text-1, #1e293b)',
                flexShrink: 0,
              }}
            >
              {sub.code}
            </span>

            {/* Evidence count */}
            {sub.evidenceCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-2, #64748b)',
                  background: 'var(--bg-2, #f1f5f9)',
                  borderRadius: 9999,
                  padding: '2px 8px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                Evidence({sub.evidenceCount})
              </span>
            )}

            {/* Description */}
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: 'var(--text-2, #64748b)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {sub.description}
            </span>

            {/* Status selector */}
            <StatusSelector
              value={sub.status}
              onChange={(status) => onStatusChange?.(sub.id, status)}
              disabled={!onStatusChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
