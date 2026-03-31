'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LumeLogo size="lg" />
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900">Cambia password</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Imposta una nuova password per il tuo account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="Nuova password"
              type="password"
              placeholder="Almeno 8 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5 text-zinc-400" />}
              required
              minLength={8}
            />

            <FormInput
              label="Conferma password"
              type="password"
              placeholder="Ripeti la password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-5 h-5 text-zinc-400" />}
              required
              minLength={8}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <FormButton type="submit" fullWidth loading={isLoading}>
              Aggiorna password
            </FormButton>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          &copy; {new Date().getFullYear()} Lume — Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
}
