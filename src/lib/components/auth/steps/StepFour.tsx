'use client';

import { Tag } from 'lucide-react';
import type { OriginType } from '@/lib/types/Salon';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';

const ORIGIN_OPTIONS: { value: OriginType; label: string }[] = [
  { value: 'word_of_mouth', label: 'Passaparola' },
  { value: 'social_media',  label: 'Social Media' },
  { value: 'google',        label: 'Google' },
  { value: 'event',         label: 'Evento' },
];

interface StepFourProps {
  onSubmit: () => void;
}

export function StepFour({ onSubmit }: StepFourProps) {
  const { origin, inviteCode, isLoading, error, setField, prevStep } = useOnboardingStore();

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (origin) onSubmit(); }} className="space-y-4">
      {/* How did you hear about us */}
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
            border-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
            hover:border-zinc-300"
        >
          <option value="" disabled>Seleziona un&apos;opzione...</option>
          {ORIGIN_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <FormInput
        label="Codice Invito (opzionale)"
        type="text"
        placeholder="es. AMICO2024"
        value={inviteCode}
        onChange={(e) => setField('inviteCode', e.target.value)}
        icon={<Tag className="w-4 h-4 text-zinc-400" />}
        autoComplete="off"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <FormButton type="button" variant="ghost" onClick={prevStep} disabled={isLoading} className="flex-1">
          ← Indietro
        </FormButton>
        <FormButton
          type="submit"
          loading={isLoading}
          disabled={!origin}
          className="flex-2"
        >
          Crea Account
        </FormButton>
      </div>
    </form>
  );
}
