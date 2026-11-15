'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { LegalAcceptance, useLegalAccepted } from '@/lib/components/auth/LegalAcceptance';
import { DURATION } from '@/lib/const/motion';

const ease = [0.2, 0, 0, 1] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, delay: i * 0.1, ease },
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
        {error && (
          <motion.div
            key={errorCode ?? 'error'}
            className="overflow-hidden"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: DURATION.slow }}
          >
            {errorCode === 'EMAIL_EXISTS_WRONG_PASSWORD' ? (
              <Callout tone="warning" title="Hai già un account con questa email.">
                Torna al passaggio precedente e inserisci la password del tuo account esistente per collegare una nuova attività.
              </Callout>
            ) : (
              <Callout tone="danger" title={error} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" size="lg" onClick={prevStep} disabled={isLoading} className="flex-1" leadingIcon={ArrowLeft}>
            Indietro
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!canSubmit}
            className="flex-2"
          >
            Crea account
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
