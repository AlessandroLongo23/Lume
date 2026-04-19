'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase/client';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { StepRouter } from '@/lib/components/auth/StepRouter';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { email, password, submitRegistration } = useOnboardingStore();

  // Reset store if the user navigates back to this page after completing it
  useEffect(() => {
    return () => { /* intentionally no reset on mount — preserves step state across re-renders */ };
  }, []);

  async function handleSubmit() {
    const { success, salonId } = await submitRegistration();
    if (!success) return;

    // Sign the new user in immediately (account was created with email_confirm: true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // Account was created but sign-in failed — send them to login
      useOnboardingStore.getState().reset();
      router.push('/login?registered=1');
      return;
    }

    // Logo upload — non-blocking: failure does not interrupt the registration flow
    const { logoFile } = useOnboardingStore.getState();
    if (logoFile && salonId) {
      try {
        const ext = logoFile.type === 'image/svg+xml' ? 'svg' : logoFile.type.split('/')[1];
        const path = `${salonId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('salon-logos')
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('salon-logos')
            .getPublicUrl(path);
          await fetch('/api/salon/logo', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoUrl: publicUrl }),
          });
        }
      } catch (e) {
        console.error('Logo upload failed (non-fatal):', e);
      }
    }

    const { firstName, salonName } = useOnboardingStore.getState();
    const params = new URLSearchParams({ name: firstName, salon: salonName });
    router.push(`/welcome?${params.toString()}`);
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
        <Link href="/login" className="text-primary-hover hover:text-primary-active transition-colors font-medium">
          Accedi
        </Link>
      </motion.p>
    </>
  );
}
