import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'na';

interface StatusSelectorProps {
  value: ComplianceStatus;
  onChange: (status: ComplianceStatus) => void;
  disabled?: boolean;
}

interface StatusOption {
  value: ComplianceStatus;
  label: string;
  description: string;
  color: string;
}

const statusOptions: StatusOption[] = [
  { value: 'compliant', label: 'Compliant', description: 'Meets all requirements', color: '#10b981' },
  { value: 'partial', label: 'Partially Compliant', description: 'Partially meets requirements', color: '#f59e0b' },
  { value: 'non_compliant', label: 'Non-Compliant', description: 'Does not meet requirements', color: '#ef4444' },
  { value: 'not_assessed', label: 'Not Assessed', description: 'Has not been evaluated', color: '#94a3b8' },
  { value: 'na', label: 'Not Applicable', description: 'Does not apply', color: '#d1d5db' },
];

export default function StatusSelector({ value, onChange, disabled = false }: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const selected = statusOptions.find((o) => o.value === value) ?? statusOptions[3];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid var(--border, #e2e8f0)',
          background: 'var(--card, #fff)',
          color: 'var(--text-1, #1e293b)',
          fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: selected.color,
            flexShrink: 0,
          }}
        />
        <span>{selected.label}</span>
        <ChevronDown size={14} style={{ color: 'var(--text-2, #64748b)' }} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 50,
            minWidth: 240,
            background: 'var(--card, #fff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: value === option.value ? 'var(--bg-2, #f1f5f9)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2, #f8fafc)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: option.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-1, #1e293b)',
                  }}
                >
                  {option.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-2, #64748b)',
                    marginTop: 1,
                  }}
                >
                  {option.description}
                </div>
              </div>
              {value === option.value && (
                <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
