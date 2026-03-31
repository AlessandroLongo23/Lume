'use client';

import { useState } from 'react';
import { User, Store } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';

export function StepTwo() {
  const { firstName, lastName, salonName, setField, nextStep, prevStep } = useOnboardingStore();
  const [errors, setErrors] = useState({ firstName: '', lastName: '', salonName: '' });

  function handleNext() {
    const next = { firstName: '', lastName: '', salonName: '' };
    if (!firstName.trim()) next.firstName = 'Il nome è obbligatorio.';
    if (!lastName.trim())  next.lastName  = 'Il cognome è obbligatorio.';
    if (!salonName.trim()) next.salonName = 'Il nome del salone è obbligatorio.';
    setErrors(next);
    if (next.firstName || next.lastName || next.salonName) return;
    nextStep();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormInput
          label="Nome"
          type="text"
          placeholder="Marco"
          value={firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          error={errors.firstName}
          icon={<User className="w-4 h-4 text-zinc-400" />}
          required
          autoComplete="given-name"
        />
        <FormInput
          label="Cognome"
          type="text"
          placeholder="Rossi"
          value={lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          error={errors.lastName}
          required
          autoComplete="family-name"
        />
      </div>

      <FormInput
        label="Nome del salone"
        type="text"
        placeholder="Salone Rossi"
        value={salonName}
        onChange={(e) => setField('salonName', e.target.value)}
        error={errors.salonName}
        icon={<Store className="w-4 h-4 text-zinc-400" />}
        required
      />

      <div className="flex gap-3 mt-2">
        <FormButton type="button" variant="ghost" onClick={prevStep} className="flex-1">
          ← Indietro
        </FormButton>
        <FormButton type="submit" className="flex-2">
          Avanti →
        </FormButton>
      </div>
    </form>
  );
}
