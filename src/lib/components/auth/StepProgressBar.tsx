'use client';

import { cn } from '@/lib/utils';
import { StepMarker } from '@/lib/components/shared/ui/StepMarker';

interface StepProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [1, 2, 3, 4] as const;

/* Neutral progress: the shared StepMarker per step, joined by a hairline that
   fills with the text colour once the step before it is done. */
export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <ol className="flex items-center justify-center mb-7" aria-label={`Passaggio ${currentStep} di ${STEPS.length}`}>
      {STEPS.map((step, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <li key={step} className="flex items-center" aria-current={isActive ? 'step' : undefined}>
            <StepMarker index={step} state={isCompleted ? 'done' : isActive ? 'current' : 'todo'} />

            {index < STEPS.length - 1 && (
              <span className="h-px w-10 bg-line relative overflow-hidden" aria-hidden>
                <span
                  className={cn(
                    'absolute inset-0 bg-[var(--lume-text)] origin-left transition-transform duration-[var(--duration-slow)] ease-[var(--ease-glide)] motion-reduce:transition-none',
                    isCompleted ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
