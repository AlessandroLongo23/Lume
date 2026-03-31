'use client';

import { useOnboardingStore } from '@/lib/stores/onboarding';
import { StepProgressBar } from './StepProgressBar';
import { StepOne }   from './steps/StepOne';
import { StepTwo }   from './steps/StepTwo';
import { StepThree } from './steps/StepThree';
import { StepFour }  from './steps/StepFour';

const STEP_META: Record<1 | 2 | 3 | 4, { label: string; subtitle: string }> = {
  1: { label: 'La Chiave',              subtitle: 'Crea le tue credenziali di accesso' },
  2: { label: "L'Identikit",            subtitle: 'Dicci chi sei e come si chiama il tuo salone' },
  3: { label: 'Il Modello di Business', subtitle: 'Che tipo di attività gestisci?' },
  4: { label: "L'Origine",             subtitle: 'Ultime informazioni, poi sei pronto' },
};

interface StepRouterProps {
  onSubmit: () => void;
}

export function StepRouter({ onSubmit }: StepRouterProps) {
  const step = useOnboardingStore((s) => s.step);
  const meta = STEP_META[step];

  return (
    <div>
      <StepProgressBar currentStep={step} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">{meta.label}</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{meta.subtitle}</p>
      </div>

      {step === 1 && <StepOne />}
      {step === 2 && <StepTwo />}
      {step === 3 && <StepThree />}
      {step === 4 && <StepFour onSubmit={onSubmit} />}
    </div>
  );
}
