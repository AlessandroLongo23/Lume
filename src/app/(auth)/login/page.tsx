'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AtSign, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { AuthCard } from '@/lib/components/auth/AuthCard';
import { DURATION } from '@/lib/const/motion';
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

const ease = [0.2, 0, 0, 1] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, delay: i * 0.05, ease },
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
    <AuthCard
      title="Bentornato"
      subtitle="Accedi al tuo gestionale"
      footer={<>Non hai un account?{' '}<TextLink href="/register">Inizia la prova gratuita</TextLink></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <FormInput
            label="Email o telefono"
            type="text"
            placeholder="nome@salone.it oppure 3331234567"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            icon={<AtSign className="size-4 text-[var(--lume-text-muted)]" />}
            size="lg"
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
            icon={<Lock className="size-4 text-[var(--lume-text-muted)]" />}
            size="lg"
            required
            autoComplete="current-password"
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="overflow-hidden"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: DURATION.slow }}
            >
              <Callout tone="danger" title={error} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
          <Button type="submit" variant="primary" size="lg" loading={isLoading} className="mt-2 w-full">
            Accedi
          </Button>
        </motion.div>
      </form>
    </AuthCard>
  );
}
