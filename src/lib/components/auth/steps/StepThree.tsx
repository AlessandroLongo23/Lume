'use client';

import { motion } from 'motion/react';
import { Scissors, Sparkles, Flower2, Hand, MoreHorizontal, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import type { BusinessType, OriginType } from '@/lib/types/Salon';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Select } from '@/lib/components/shared/ui/forms/Select';

const BUSINESS_TYPES: { value: BusinessType; label: string; icon: React.ReactNode }[] = [
  { value: 'barber',        label: 'Barbiere',              icon: <Scissors   className="w-6 h-6" /> },
  { value: 'hair_salon',    label: 'Parrucchiere',          icon: <Sparkles   className="w-6 h-6" /> },
  { value: 'beauty_center', label: 'Centro Estetico',       icon: <Flower2    className="w-6 h-6" /> },
  { value: 'nails',         label: 'Nails',                 icon: <Hand       className="w-6 h-6" /> },
  { value: 'other',         label: 'Altro',                 icon: <MoreHorizontal className="w-6 h-6" /> },
];

const ORIGIN_OPTIONS: { value: OriginType; label: string }[] = [
  { value: 'word_of_mouth', label: 'Passaparola' },
  { value: 'social_media',  label: 'Social Media' },
  { value: 'google',        label: 'Google' },
  { value: 'event',         label: 'Evento' },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease },
  }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.45 + i * 0.1, ease },
  }),
};

const buttonVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.75, ease } },
};

export function StepThree() {
  const { businessType, origin, inviteCode, setField, nextStep, prevStep } = useOnboardingStore();
  const canSubmit = Boolean(businessType) && Boolean(origin);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) nextStep(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {BUSINESS_TYPES.map(({ value, label, icon }, i) => {
          const isSelected = businessType === value;
          return (
            <motion.button
              key={value}
              type="button"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setField('businessType', isSelected ? null : value)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors duration-200 cursor-pointer
                ${isSelected
                  ? 'border-primary bg-primary/10 text-primary-hover'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-100'
                }
                ${value === 'other' ? 'col-span-2' : ''}`}
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="space-y-2">
          <label className="block text-sm font-thin text-zinc-700 mb-2">
            Come hai conosciuto Lume? <span className="text-red-500 ml-1">*</span>
          </label>
          <Select
            value={origin}
            onChange={(v) => setField('origin', (v as OriginType) || null)}
            options={ORIGIN_OPTIONS}
            labelKey="label"
            valueKey="value"
            placeholder="Seleziona un'opzione..."
            searchable={false}
            size="md"
          />
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

      <motion.div variants={buttonVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" onClick={prevStep} className="flex-1">
            <ArrowLeft className="size-4" aria-hidden />
            Indietro
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            className="flex-2"
          >
            Avanti <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
