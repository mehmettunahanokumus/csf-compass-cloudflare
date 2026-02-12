import React from 'react';
import { ChevronLeft, ChevronRight, Save, Loader2, CheckCircle2 } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number[];
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  isSaving?: boolean;
  isLastStep?: boolean;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  completedSteps = [],
  onPrevious,
  onNext,
  onSaveDraft,
  isSaving = false,
  isLastStep = false,
}) => {
  const isFirstStep = currentStep === 0;

  const renderDots = () => {
    const maxDots = 7;
    const dots: React.ReactNode[] = [];

    if (totalSteps <= maxDots) {
      for (let i = 0; i < totalSteps; i++) {
        dots.push(
          <div
            key={i}
            style={{
              width: i === currentStep ? '10px' : '8px',
              height: i === currentStep ? '10px' : '8px',
              borderRadius: '50%',
              background:
                i === currentStep
                  ? 'var(--accent)'
                  : completedSteps.includes(i)
                    ? 'var(--green)'
                    : 'var(--border-hover)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          />
        );
      }
    } else {
      const start = Math.max(0, currentStep - 2);
      const end = Math.min(totalSteps - 1, start + maxDots - 1);
      const adjustedStart = Math.max(0, end - maxDots + 1);

      if (adjustedStart > 0) {
        dots.push(
          <span key="start-ellipsis" style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            ...
          </span>
        );
      }

      for (let i = adjustedStart; i <= end; i++) {
        dots.push(
          <div
            key={i}
            style={{
              width: i === currentStep ? '10px' : '8px',
              height: i === currentStep ? '10px' : '8px',
              borderRadius: '50%',
              background:
                i === currentStep
                  ? 'var(--accent)'
                  : completedSteps.includes(i)
                    ? 'var(--green)'
                    : 'var(--border-hover)',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          />
        );
      }

      if (end < totalSteps - 1) {
        dots.push(
          <span key="end-ellipsis" style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            ...
          </span>
        );
      }
    }

    return dots;
  };

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      {/* Left: Previous */}
      <button
        onClick={onPrevious}
        disabled={isFirstStep}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: isFirstStep ? 'var(--text-4)' : 'var(--text-2)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-sans)',
          cursor: isFirstStep ? 'not-allowed' : 'pointer',
          opacity: isFirstStep ? 0.5 : 1,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isFirstStep) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      {/* Center: Dot indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {renderDots()}
      </div>

      {/* Right: Save Draft + Next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: isSaving ? 'var(--text-3)' : 'var(--text-2)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Draft
            </>
          )}
        </button>

        <button
          onClick={onNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
          }}
        >
          {isLastStep ? (
            <>
              Complete Assessment
              <CheckCircle2 size={16} />
            </>
          ) : (
            <>
              Next
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepNavigation;
