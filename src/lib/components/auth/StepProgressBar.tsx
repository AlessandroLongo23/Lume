'use client';

import { motion } from 'motion/react';

interface StepProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [1, 2, 3, 4] as const;

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Dot */}
            <motion.div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${isCompleted
                  ? 'bg-primary text-white'
                  : isActive
                    ? 'bg-primary text-white'
                    : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                }`}
              initial={false}
              animate={{
                scale: isActive ? [1, 1.15, 1] : 1,
                boxShadow: isActive
                  ? '0 0 0 4px rgba(99, 102, 241, 0.2)'
                  : '0 0 0 0px rgba(99, 102, 241, 0)',
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {isCompleted ? (
                <motion.svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : (
                <motion.span
                  key={`num-${step}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {step}
                </motion.span>
              )}
            </motion.div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="h-px w-10 bg-zinc-200 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-primary origin-left"
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
