'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase/client';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { StepRouter } from '@/lib/components/auth/StepRouter';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function RegisterPage() {
  const { email, password, submitRegistration, reset } = useOnboardingStore();

  // Reset store if the user navigates back to this page after completing it
  useEffect(() => {
    return () => { /* intentionally no reset on mount — preserves step state across re-renders */ };
  }, []);

  async function handleSubmit() {
    const { success } = await submitRegistration();
    if (!success) return;

    // Sign the new user in immediately (account was created with email_confirm: true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Account was created but sign-in failed — send them to login
      useOnboardingStore.getState().reset();
      window.location.href = '/login?registered=1';
      return;
    }

    reset();
    window.location.href = '/admin/bilancio';
  }

  return (
    <>
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <h1 className="text-xl font-semibold text-zinc-900">Inizia la prova gratuita</h1>
        <p className="text-sm text-zinc-500 mt-1">30 giorni gratuiti, nessuna carta di credito richiesta</p>
      </motion.div>

      <StepRouter onSubmit={handleSubmit} />

      <motion.p
        className="text-center text-sm text-zinc-500 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        Hai già un account?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium">
          Accedi
        </Link>
      </motion.p>
    </>
  );
}
