'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { StepRouter } from '@/lib/components/auth/StepRouter';
import { AuthCard } from '@/lib/components/auth/AuthCard';
import { TextLink } from '@/lib/components/shared/ui/TextLink';

export default function RegisterPage() {
  const router = useRouter();
  const { email, password, submitRegistration } = useOnboardingStore();

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
    <AuthCard
      title="Inizia la prova gratuita"
      subtitle="30 giorni gratuiti, nessuna carta di credito richiesta"
      footer={<>Hai già un account?{' '}<TextLink href="/login">Accedi</TextLink></>}
    >
      <StepRouter onSubmit={handleSubmit} />
    </AuthCard>
  );
}
