'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email o password non corretti.',
  'Email not confirmed':       'Conferma la tua email prima di accedere.',
  'Too many requests':         'Troppi tentativi. Riprova tra qualche minuto.',
};

function mapError(message: string): string {
  for (const [key, italian] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(key)) return italian;
  }
  return 'Accesso non riuscito. Riprova.';
}

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(mapError(authError.message));
      setIsLoading(false);
      return;
    }

    window.location.href = '/admin/bilancio';
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Bentornato</h1>
        <p className="text-sm text-zinc-500 mt-1">Accedi al tuo gestionale</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          placeholder="nome@salone.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4 text-zinc-400" />}
          required
          autoComplete="email"
        />

        <FormInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4 text-zinc-400" />}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <FormButton type="submit" fullWidth loading={isLoading} className="mt-2">
          Accedi
        </FormButton>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Non hai un account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium">
          Inizia la prova gratuita
        </Link>
      </p>
    </>
  );
}
