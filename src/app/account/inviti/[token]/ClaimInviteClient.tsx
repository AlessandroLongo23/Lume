'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { AuthCard } from '@/lib/components/auth/AuthCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';

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

  if (claimed) {
    return (
      <AuthCard
        align="center"
        title="Invito accettato!"
        subtitle={<>Benvenuto in <strong className="font-medium text-[var(--lume-text)]">{salonName}</strong>. Stai per essere reindirizzato...</>}
      >
        {null}
      </AuthCard>
    );
  }

  if (state === 'invalid') {
    return (
      <AuthCard align="center" title="Invito non trovato" subtitle="Questo link non è valido o l'invito è già stato utilizzato.">
        <Button variant="secondary" asChild className="w-full">
          <Link href="/">Torna alla home</Link>
        </Button>
      </AuthCard>
    );
  }

  if (state === 'expired') {
    return (
      <AuthCard align="center" title="Invito scaduto" subtitle="Questo invito è scaduto. Chiedi al titolare del salone di inviarne uno nuovo.">
        <Button variant="secondary" asChild className="w-full">
          <Link href="/">Torna alla home</Link>
        </Button>
      </AuthCard>
    );
  }

  if (state === 'already_claimed') {
    return (
      <AuthCard align="center" title="Invito già accettato" subtitle="Hai già accettato questo invito.">
        <Button variant="primary" className="w-full" onClick={() => router.push('/admin/calendario')}>
          Vai al gestionale
        </Button>
      </AuthCard>
    );
  }

  if (state === 'wrong_user') {
    return (
      <AuthCard
        align="center"
        title="Account sbagliato"
        subtitle={
          <>
            Questo invito è destinato a <strong className="font-medium text-[var(--lume-text)]">{email}</strong>, ma sei collegato come{' '}
            <strong className="font-medium text-[var(--lume-text)]">{currentUserEmail}</strong>. Accedi con l&apos;account corretto per continuare.
          </>
        }
      >
        <Button variant="secondary" asChild className="w-full">
          <Link href="/">Torna alla home</Link>
        </Button>
      </AuthCard>
    );
  }

  if (!isLoggedIn) {
    return (
      <AuthCard
        align="center"
        title="Accedi per continuare"
        subtitle={
          <>
            Sei stato invitato a unirti a <strong className="font-medium text-[var(--lume-text)]">{salonName}</strong>. Accedi al tuo account Lume
            per accettare l&apos;invito.
          </>
        }
      >
        <Button variant="primary" leadingIcon={LogIn} className="w-full" onClick={() => router.push('/login')}>
          Accedi a Lume
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      align="center"
      title="Invito ricevuto"
      subtitle={<>Sei stato invitato a unirti a <strong className="font-medium text-[var(--lume-text)]">{salonName}</strong> come operatore.</>}
    >
      <div className="flex flex-col gap-4">
        {error && <Callout tone="danger">{error}</Callout>}
        <Button variant="primary" loading={isLoading} onClick={handleAccept} className="w-full">
          {isLoading ? 'Accettando...' : 'Accetta invito'}
        </Button>
      </div>
    </AuthCard>
  );
}
