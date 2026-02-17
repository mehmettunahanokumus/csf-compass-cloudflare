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
            className={`rounded-full transition-all ${
              i === currentStep
                ? 'w-2.5 h-2.5 bg-amber-500'
                : completedSteps.includes(i)
                  ? 'w-2 h-2 bg-emerald-500/60'
                  : 'w-2 h-2 bg-white/[0.1]'
            }`}
          />
        );
      }
    } else {
      const start = Math.max(0, currentStep - 2);
      const end = Math.min(totalSteps - 1, start + maxDots - 1);
      const adjustedStart = Math.max(0, end - maxDots + 1);

      if (adjustedStart > 0) {
        dots.push(
          <span key="start-ellipsis" className="font-mono text-[10px] text-[#55576A]">
            ...
          </span>
        );
      }

      for (let i = adjustedStart; i <= end; i++) {
        dots.push(
          <div
            key={i}
            className={`rounded-full transition-all ${
              i === currentStep
                ? 'w-2.5 h-2.5 bg-amber-500'
                : completedSteps.includes(i)
                  ? 'w-2 h-2 bg-emerald-500/60'
                  : 'w-2 h-2 bg-white/[0.1]'
            }`}
          />
        );
      }

      if (end < totalSteps - 1) {
        dots.push(
          <span key="end-ellipsis" className="font-mono text-[10px] text-[#55576A]">
            ...
          </span>
        );
      }
    }

    return dots;
  };

  return (
    <div className="sticky bottom-0 z-30 bg-[#08090E]/95 backdrop-blur-sm border-t border-white/[0.06] px-6 py-4 flex items-center justify-between gap-4">
      {/* Left: Previous */}
      <button
        onClick={onPrevious}
        disabled={isFirstStep}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/[0.07] disabled:hover:text-[#8E8FA8]"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      {/* Center: Dot indicators */}
      <div className="hidden md:flex items-center gap-1.5">
        {renderDots()}
      </div>

      {/* Right: Save Draft + Next */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveDraft}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </>
          )}
        </button>

        <button
          onClick={onNext}
          className={`inline-flex items-center gap-1.5 px-4 py-2 font-display text-sm font-semibold rounded-lg transition-colors ${
            isLastStep
              ? 'bg-emerald-500 text-[#08090E] hover:bg-emerald-400'
              : 'bg-amber-500 text-[#08090E] hover:bg-amber-400'
          }`}
        >
          {isLastStep ? (
            <>
              Complete Assessment
              <CheckCircle2 className="w-4 h-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepNavigation;
