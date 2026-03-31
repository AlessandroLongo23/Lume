'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { StepRouter } from '@/lib/components/auth/StepRouter';

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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Inizia la prova gratuita</h1>
        <p className="text-sm text-zinc-500 mt-1">30 giorni gratuiti, nessuna carta di credito richiesta</p>
      </div>

      <StepRouter onSubmit={handleSubmit} />

      <p className="text-center text-sm text-zinc-500 mt-6">
        Hai già un account?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium">
          Accedi
        </Link>
      </p>
    </>
  );
}
