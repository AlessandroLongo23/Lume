'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Button } from '@/lib/components/shared/ui/Button';
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
          size="lg"
          label="Email"
          type="email"
          placeholder="nome@salone.it"
          value={email}
          onChange={(e) => setField('email', e.target.value)}
          error={errors.email}
          icon={<Mail className="size-4 text-[var(--lume-text-muted)]" />}
          required
          autoComplete="email"
        />
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <FormInput
          size="lg"
          label="Password"
          type="password"
          placeholder="Minimo 8 caratteri"
          value={password}
          onChange={(e) => setField('password', e.target.value)}
          error={errors.password}
          icon={<Lock className="size-4 text-[var(--lume-text-muted)]" />}
          required
          autoComplete="new-password"
        />
      </motion.div>

      <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" trailingIcon={ArrowRight}>
          Avanti
        </Button>
      </motion.div>
    </form>
  );
}
