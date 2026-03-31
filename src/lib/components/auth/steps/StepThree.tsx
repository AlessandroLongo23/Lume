'use client';

import { Scissors, Sparkles, Flower2, Hand, MoreHorizontal } from 'lucide-react';
import type { BusinessType } from '@/lib/types/Salon';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';

const BUSINESS_TYPES: { value: BusinessType; label: string; icon: React.ReactNode }[] = [
  { value: 'barber',        label: 'Barbiere',              icon: <Scissors   className="w-6 h-6" /> },
  { value: 'hair_salon',    label: 'Parrucchiere',          icon: <Sparkles   className="w-6 h-6" /> },
  { value: 'beauty_center', label: 'Centro Estetico',       icon: <Flower2    className="w-6 h-6" /> },
  { value: 'nails',         label: 'Nails',                 icon: <Hand       className="w-6 h-6" /> },
  { value: 'other',         label: 'Altro',                 icon: <MoreHorizontal className="w-6 h-6" /> },
];

export function StepThree() {
  const { businessType, setField, nextStep, prevStep } = useOnboardingStore();

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (businessType) nextStep(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {BUSINESS_TYPES.map(({ value, label, icon }) => {
          const isSelected = businessType === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setField('businessType', isSelected ? null : value)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-100'
                }
                ${value === 'other' ? 'col-span-2' : ''}`}
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2">
        <FormButton type="button" variant="ghost" onClick={prevStep} className="flex-1">
          ← Indietro
        </FormButton>
        <FormButton
          type="submit"
          disabled={!businessType}
          className="flex-2"
        >
          Avanti →
        </FormButton>
      </div>
    </form>
  );
}
