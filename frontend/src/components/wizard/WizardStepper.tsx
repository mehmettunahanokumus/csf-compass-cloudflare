import React from 'react';
import { Check } from 'lucide-react';

interface WizardStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  totalSteps?: number;
}

const STEP_NAMES = [
  'Governance & Policy',
  'Entra ID / Azure AD',
  'Microsoft Defender',
  'AWS Security',
  'Network Security',
  'Endpoint Protection',
  'Data Protection',
  'Identity & Access Management',
  'Security Monitoring',
  'Incident Response',
  'Backup & Recovery',
  'Vulnerability Management',
  'Vendor Risk Management',
  'Security Awareness Training',
  'Business Continuity',
];

const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  totalSteps = 15,
}) => {
  const progress = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Wizard Steps
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 320px)',
          padding: '8px 0',
        }}
      >
        {STEP_NAMES.slice(0, totalSteps).map((name, index) => {
          const isCurrent = index === currentStep;
          const isCompleted = completedSteps.includes(index);

          return (
            <button
              key={index}
              onClick={() => onStepClick(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: isCurrent ? 'var(--accent-subtle)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isCurrent
                  ? 'var(--accent-subtle)'
                  : 'transparent';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  background: isCurrent
                    ? 'var(--accent)'
                    : isCompleted
                      ? 'var(--green)'
                      : 'var(--gray-subtle)',
                  color: isCurrent || isCompleted ? '#fff' : 'var(--text-3)',
                }}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
              </div>

              <span
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--text-1)' : isCompleted ? 'var(--text-2)' : 'var(--text-3)',
                  lineHeight: 1.3,
                }}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Overall Progress
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-1)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {progress}%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: '3px',
            background: 'var(--gray-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: '3px',
              background: progress === 100 ? 'var(--green)' : 'var(--accent)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardStepper;
