'use client';

interface StepProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [1, 2, 3, 4] as const;

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, index) => (
        <div key={step} className="flex items-center">
          {/* Dot */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
              ${step < currentStep
                ? 'bg-indigo-500 text-white'
                : step === currentStep
                  ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
              }`}
          >
            {step < currentStep ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step
            )}
          </div>

          {/* Connector line */}
          {index < STEPS.length - 1 && (
            <div
              className={`h-px w-10 transition-all duration-300
                ${step < currentStep ? 'bg-indigo-500' : 'bg-zinc-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
