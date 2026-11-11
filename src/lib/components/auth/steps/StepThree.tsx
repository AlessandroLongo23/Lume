'use client';

import { motion } from 'motion/react';
import { Scissors, Sparkles, Flower2, Hand, MoreHorizontal, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import type { BusinessType, OriginType } from '@/lib/types/Salon';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { OptionGroup, type Option } from '@/lib/components/shared/ui/forms/OptionGroup';
import { DURATION } from '@/lib/const/motion';

const BUSINESS_TYPES: Option<BusinessType>[] = [
  { value: 'barber',        label: 'Barbiere',        icon: Scissors },
  { value: 'hair_salon',    label: 'Parrucchiere',    icon: Sparkles },
  { value: 'beauty_center', label: 'Centro Estetico', icon: Flower2 },
  { value: 'nails',         label: 'Nails',           icon: Hand },
  { value: 'other',         label: 'Altro',           icon: MoreHorizontal },
];

const ORIGIN_OPTIONS: { value: OriginType; label: string }[] = [
  { value: 'word_of_mouth', label: 'Passaparola' },
  { value: 'social_media',  label: 'Social Media' },
  { value: 'google',        label: 'Google' },
  { value: 'event',         label: 'Evento' },
];

const ease = [0.2, 0, 0, 1] as const;

const groupVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.enter, ease } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, delay: 0.45 + i * 0.1, ease },
  }),
};

const buttonVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.enter, delay: 0.75, ease } },
};

export function StepThree() {
  const { businessType, origin, inviteCode, setField, nextStep, prevStep } = useOnboardingStore();
  const canSubmit = Boolean(businessType) && Boolean(origin);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) nextStep(); }} className="space-y-4">
      <motion.div variants={groupVariants} initial="hidden" animate="visible">
        <Field label="Tipo di attività" required>
          {() => (
            <OptionGroup
              ariaLabel="Tipo di attività"
              value={businessType ?? ('' as BusinessType)}
              options={BUSINESS_TYPES}
              // A second click on the chosen type clears it.
              onChange={(v) => setField('businessType', v === businessType ? null : v)}
            />
          )}
        </Field>
      </motion.div>

      <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
        <Field label="Come hai conosciuto Lume?" required>
          {({ id }) => (
            <Select
              id={id}
              value={origin}
              onChange={(v) => setField('origin', (v as OriginType) || null)}
              options={ORIGIN_OPTIONS}
              labelKey="label"
              valueKey="value"
              placeholder="Seleziona un'opzione..."
              searchable={false}
              size="lg"
            />
          )}
        </Field>
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <FormInput
          size="lg"
          label="Codice Invito (opzionale)"
          type="text"
          placeholder="es. AMICO2024"
          value={inviteCode}
          onChange={(e) => setField('inviteCode', e.target.value)}
          icon={<Tag className="size-4 text-[var(--lume-text-muted)]" />}
          autoComplete="off"
        />
      </motion.div>

      <motion.div variants={buttonVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" size="lg" onClick={prevStep} className="flex-1" leadingIcon={ArrowLeft}>
            Indietro
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            className="flex-2"
            trailingIcon={ArrowRight}
          >
            Avanti
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
