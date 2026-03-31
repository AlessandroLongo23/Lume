'use client';

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StepOne() {
  const { email, password, setField, nextStep } = useOnboardingStore();
  const [errors, setErrors] = useState({ email: '', password: '' });

  function handleNext() {
    const next = { email: '', password: '' };
    if (!email || !validateEmail(email))  next.email    = 'Inserisci un indirizzo email valido.';
    if (password.length < 8)             next.password = 'La password deve contenere almeno 8 caratteri.';
    setErrors(next);
    if (next.email || next.password) return;
    nextStep();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
      <FormInput
        label="Email"
        type="email"
        placeholder="nome@salone.it"
        value={email}
        onChange={(e) => setField('email', e.target.value)}
        error={errors.email}
        icon={<Mail className="w-4 h-4 text-zinc-400" />}
        required
        autoComplete="email"
      />

      <FormInput
        label="Password"
        type="password"
        placeholder="Minimo 8 caratteri"
        value={password}
        onChange={(e) => setField('password', e.target.value)}
        error={errors.password}
        icon={<Lock className="w-4 h-4 text-zinc-400" />}
        required
        autoComplete="new-password"
      />

      <FormButton type="submit" fullWidth className="mt-2">
        Avanti →
      </FormButton>
    </form>
  );
}
