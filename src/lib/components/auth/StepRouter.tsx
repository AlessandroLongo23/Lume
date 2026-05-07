'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { StepProgressBar } from './StepProgressBar';
import { StepOne }   from './steps/StepOne';
import { StepTwo }   from './steps/StepTwo';
import { StepThree } from './steps/StepThree';
import { StepFour }  from './steps/StepFour';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const stepVariants = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
};

const STEP_META: Record<1 | 2 | 3 | 4, { label: string; subtitle: string }> = {
  1: { label: 'Account',                subtitle: 'Crea le tue credenziali di accesso' },
  2: { label: 'Profilo',                subtitle: 'Dicci chi sei e come si chiama il tuo salone' },
  3: { label: 'Attività',               subtitle: 'Che tipo di attività gestisci?' },
  4: { label: 'Ultimi dettagli',        subtitle: 'Ultime informazioni, poi sei pronto' },
};

const STEPS: Record<number, React.ComponentType<{ onSubmit?: () => void }>> = {
  1: StepOne,
  2: StepTwo,
  3: StepThree,
  4: StepFour,
};

interface StepRouterProps {
  onSubmit: () => void;
}

export function StepRouter({ onSubmit }: StepRouterProps) {
  const step = useOnboardingStore((s) => s.step);
  const direction = useOnboardingStore((s) => s.direction);
  const meta = STEP_META[step];

  const StepComponent = STEPS[step];

  return (
    <div>
      <StepProgressBar currentStep={step} />

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease }}
          >
            {/* Step heading */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">{meta.label}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{meta.subtitle}</p>
            </div>

            {/* Step content */}
            <StepComponent onSubmit={step === 4 ? onSubmit : undefined} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
