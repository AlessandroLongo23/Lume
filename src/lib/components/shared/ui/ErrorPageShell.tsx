'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { Button } from '@/lib/components/shared/ui/Button';

type ErrorPageShellProps = {
  code?: string;
  title: string;
  description: string;
  destinationHref: string;
  destinationLabel: string;
  countdownSeconds?: number;
  extraAction?: {
    label: string;
    onClick: () => void;
  };
};

export function ErrorPageShell({
  code,
  title,
  description,
  destinationHref,
  destinationLabel,
  countdownSeconds = 5,
  extraAction,
}: ErrorPageShellProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(countdownSeconds);
  const [cancelled, setCancelled] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (cancelled) return;

    if (remaining <= 0) {
      if (!redirected.current) {
        redirected.current = true;
        router.replace(destinationHref);
      }
      return;
    }

    const id = setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, cancelled, destinationHref, router]);

  const goNow = () => {
    if (redirected.current) return;
    redirected.current = true;
    router.replace(destinationHref);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 py-12 bg-[var(--lume-bg)] text-[var(--lume-text)]">
      <div className="w-full max-w-xl flex flex-col items-center text-center gap-8">
        <LumeLogo size="lg" />

        <div className="flex flex-col items-center gap-3">
          {code && (
            <span className="text-6xl md:text-7xl font-semibold tracking-tight text-primary">
              {code}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-base text-[var(--lume-text-muted)] max-w-md">
            {description}
          </p>
        </div>

        <div
          aria-live="polite"
          className="min-h-[3rem] flex items-center text-sm text-[var(--lume-text-muted)]"
        >
          {cancelled ? (
            <span>Reindirizzamento automatico annullato.</span>
          ) : (
            <span>
              Verrai reindirizzato a{' '}
              <span className="font-medium text-[var(--lume-text)]">
                {destinationLabel}
              </span>{' '}
              tra <span className="font-medium text-primary">{remaining}</span>{' '}
              {remaining === 1 ? 'secondo' : 'secondi'}...
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={goNow}>Vai ora</Button>
          {!cancelled && (
            <Button variant="secondary" onClick={() => setCancelled(true)}>Annulla</Button>
          )}
          {extraAction && (
            <Button variant="secondary" onClick={extraAction.onClick}>{extraAction.label}</Button>
          )}
        </div>
      </div>
    </main>
  );
}
