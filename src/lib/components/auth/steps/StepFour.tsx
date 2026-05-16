'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { Button } from '@/lib/components/shared/ui/Button';
import { LegalAcceptance, useLegalAccepted } from '@/lib/components/auth/LegalAcceptance';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease },
  }),
};

interface StepFourProps {
  onSubmit?: () => void;
}

export function StepFour({ onSubmit }: StepFourProps) {
  const { isLoading, error, errorCode, prevStep } = useOnboardingStore();
  const canSubmit = useLegalAccepted();

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canSubmit && onSubmit) onSubmit(); }} className="space-y-4">
      <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
        <LegalAcceptance />
      </motion.div>

      <AnimatePresence>
        {error && errorCode === 'EMAIL_EXISTS_WRONG_PASSWORD' && (
          <motion.div
            className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-amber-800 font-medium">Hai già un account con questa email.</p>
            <p className="text-amber-700 mt-1">
              Torna al passaggio precedente e inserisci la password del tuo account esistente per collegare una nuova attività.
            </p>
          </motion.div>
        )}
        {error && !errorCode && (
          <motion.p
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={prevStep} disabled={isLoading} className="flex-1">
            <ArrowLeft className="size-4" aria-hidden />
            Indietro
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!canSubmit}
            className="flex-2"
          >
            Crea Account
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
