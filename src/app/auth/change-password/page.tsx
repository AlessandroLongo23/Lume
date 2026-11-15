'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { AuthCard, AuthShell } from '@/lib/components/auth/AuthCard';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Le password non corrispondono.');
      return;
    }

    setIsLoading(true);

    // 1. Update the password via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError('Impossibile aggiornare la password. Riprova.');
      setIsLoading(false);
      return;
    }

    // 2. Clear the must_change_password flag
    const res = await fetch('/api/operators/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError('Password aggiornata, ma errore nel completare la configurazione. Riprova.');
      setIsLoading(false);
      return;
    }

    // 3. Redirect to admin
    window.location.href = '/admin/bilancio';
  }

  // No way back to the home: the account must set its own password first.
  return (
    <AuthShell backToHome={false}>
      <AuthCard title="Cambia password" subtitle="Imposta una nuova password per il tuo account">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            size="lg"
            label="Nuova password"
            type="password"
            placeholder="Almeno 8 caratteri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="size-4" />}
            required
            minLength={8}
          />

          <FormInput
            size="lg"
            label="Conferma password"
            type="password"
            placeholder="Ripeti la password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="size-4" />}
            required
            minLength={8}
          />

          {error && <Callout tone="danger" title={error} />}

          <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
            Aggiorna password
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
