'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Button } from '@/lib/components/shared/ui/Button';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease },
  }),
};

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
      <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
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
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
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
      </motion.div>

      <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
        <Button type="submit" variant="primary" fullWidth className="mt-2">
          Avanti <ArrowRight className="size-4" aria-hidden />
        </Button>
      </motion.div>
    </form>
  );
}
