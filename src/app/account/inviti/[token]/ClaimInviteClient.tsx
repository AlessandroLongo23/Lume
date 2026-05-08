'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, LogIn } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';

type InviteState =
  | 'invalid'
  | 'expired'
  | 'already_claimed'
  | 'declined'
  | 'wrong_user'
  | 'ready';

interface Props {
  token: string;
  salonName: string;
  email: string;
  state: InviteState;
  isLoggedIn: boolean;
  currentUserEmail: string | null;
}

export function ClaimInviteClient({
  token,
  salonName,
  email,
  state,
  isLoggedIn,
  currentUserEmail,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  async function handleAccept() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/memberships/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? 'Errore sconosciuto.');
        return;
      }
      setClaimed(true);
      setTimeout(() => router.push('/admin/calendario'), 1500);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setIsLoading(false);
    }
  }

  const cardClass =
    'max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-sm';

  if (claimed) {
    return (
      <div className={cardClass}>
        <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Invito accettato!
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Benvenuto in <strong>{salonName}</strong>. Stai per essere reindirizzato...
        </p>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className={cardClass}>
        <XCircle className="size-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Invito non trovato
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Questo link non è valido o l&apos;invito è già stato utilizzato.
        </p>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className={cardClass}>
        <Clock className="size-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Invito scaduto
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Questo invito è scaduto. Chiedi al titolare del salone di inviarne uno nuovo.
        </p>
      </div>
    );
  }

  if (state === 'already_claimed') {
    return (
      <div className={cardClass}>
        <CheckCircle className="size-12 text-zinc-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Invito già accettato
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Hai già accettato questo invito.
        </p>
        <Button variant="primary" onClick={() => router.push('/admin/calendario')}>
          Vai al gestionale
        </Button>
      </div>
    );
  }

  if (state === 'wrong_user') {
    return (
      <div className={cardClass}>
        <XCircle className="size-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Account sbagliato
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Questo invito è destinato a <strong>{email}</strong>, ma sei collegato come{' '}
          <strong>{currentUserEmail}</strong>. Accedi con l&apos;account corretto per continuare.
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={cardClass}>
        <LogIn className="size-12 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Accedi per continuare
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Sei stato invitato a unirti a <strong>{salonName}</strong>. Accedi al tuo account Lume
          per accettare l&apos;invito.
        </p>
        <Button
          variant="primary"
          leadingIcon={LogIn}
          onClick={() => router.push('/login')}
          className="w-full"
        >
          Accedi a Lume
        </Button>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Invito ricevuto
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Sei stato invitato a unirti a <strong>{salonName}</strong> come operatore.
      </p>
      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button
        variant="primary"
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Accettando...' : 'Accetta invito'}
      </Button>
    </div>
  );
}
