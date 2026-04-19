'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AtSign, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';
import { isEmailLike, normalizeLoginPhone } from '@/lib/utils/phone';

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

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const trimmed = identifier.trim();
    const credentials = isEmailLike(trimmed)
      ? { email: trimmed, password }
      : (() => {
          const phone = normalizeLoginPhone(trimmed);
          return phone ? { phone, password } : null;
        })();

    if (!credentials) {
      setError('Inserisci un\'email o un numero di telefono valido.');
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword(credentials);

    if (authError) {
      setError(mapError(authError.message));
      setIsLoading(false);
      return;
    }

    const result = await useWorkspaceStore.getState().resolve();
    router.push(result.redirect);
  }

  return (
    <>
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <h1 className="text-xl font-semibold text-zinc-900">Bentornato</h1>
        <p className="text-sm text-zinc-500 mt-1">Accedi al tuo gestionale</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <FormInput
            label="Email o telefono"
            type="text"
            placeholder="nome@salone.it oppure 3331234567"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<AtSign className="w-4 h-4 text-zinc-400" />}
            required
            autoComplete="username"
          />
        </motion.div>

        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
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
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
          <FormButton type="submit" fullWidth loading={isLoading} className="mt-2">
            Accedi
          </FormButton>
        </motion.div>
      </form>

      <motion.p
        className="text-center text-sm text-zinc-500 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        Non hai un account?{' '}
        <Link href="/register" className="text-primary-hover hover:text-primary-active transition-colors font-medium">
          Inizia la prova gratuita
        </Link>
      </motion.p>
    </>
  );
}
