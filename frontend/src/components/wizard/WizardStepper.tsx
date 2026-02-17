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
    <div className="flex flex-col h-full bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[#55576A]">
          Wizard Steps
        </span>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] py-1 scrollbar-thin">
        {STEP_NAMES.slice(0, totalSteps).map((name, index) => {
          const isCurrent = index === currentStep;
          const isCompleted = completedSteps.includes(index);

          return (
            <button
              key={index}
              onClick={() => onStepClick(index)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all ${
                isCurrent
                  ? 'bg-amber-500/[0.08] border-r-2 border-r-amber-500'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Step dot/number */}
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 text-[10px] font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-[#08090E]'
                    : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.06] text-[#55576A]'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3" strokeWidth={3} /> : index + 1}
              </div>

              {/* Step label */}
              <span
                className={`font-mono text-[11px] leading-tight ${
                  isCurrent
                    ? 'font-semibold text-amber-400'
                    : isCompleted
                      ? 'text-[#8E8FA8]'
                      : 'text-[#55576A]'
                }`}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress footer */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-sans text-[10px] font-medium text-[#55576A] uppercase tracking-wider">
            Progress
          </span>
          <span className="font-mono text-xs font-bold text-amber-400">{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardStepper;
