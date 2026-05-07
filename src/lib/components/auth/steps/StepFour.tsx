'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Tag } from 'lucide-react';
import type { OriginType } from '@/lib/types/Salon';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Button } from '@/lib/components/shared/ui/Button';

const ORIGIN_OPTIONS: { value: OriginType; label: string }[] = [
  { value: 'word_of_mouth', label: 'Passaparola' },
  { value: 'social_media',  label: 'Social Media' },
  { value: 'google',        label: 'Google' },
  { value: 'event',         label: 'Evento' },
];

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
  const { origin, inviteCode, isLoading, error, errorCode, setField, prevStep } = useOnboardingStore();

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (origin && onSubmit) onSubmit(); }} className="space-y-4">
      {/* How did you hear about us */}
      <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="space-y-2">
          <label className="block text-sm font-thin text-zinc-700 mb-2">
            Come hai conosciuto Lume? <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={origin ?? ''}
            onChange={(e) => setField('origin', e.target.value as OriginType || null)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
              bg-white text-zinc-900 focus:outline-none cursor-pointer
              border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/20
              hover:border-zinc-300"
          >
            <option value="" disabled>Seleziona un&apos;opzione...</option>
            {ORIGIN_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <FormInput
          label="Codice Invito (opzionale)"
          type="text"
          placeholder="es. AMICO2024"
          value={inviteCode}
          onChange={(e) => setField('inviteCode', e.target.value)}
          icon={<Tag className="w-4 h-4 text-zinc-400" />}
          autoComplete="off"
        />
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

      <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={prevStep} disabled={isLoading} className="flex-1">
            <ArrowLeft className="size-4" aria-hidden />
            Indietro
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!origin}
            className="flex-2"
          >
            Crea Account
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
