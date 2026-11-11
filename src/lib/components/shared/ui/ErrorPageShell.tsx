'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { Button } from '@/lib/components/shared/ui/Button';
import { ArrowRight, LucideIcon, X } from 'lucide-react';

const COUNTDOWN_SECONDS = 5;

type ErrorPageShellProps = {
  code: string;
  title: string;
  description: string;
  destinationHref: string;
  destinationLabel: string;
  extraAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
};

export function ErrorPageShell({
  code,
  title,
  description,
  destinationHref,
  destinationLabel,
  extraAction,
}: ErrorPageShellProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
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
    <main className="min-h-dvh w-full flex flex-col bg-[var(--lume-bg)] text-[var(--lume-text)]">
      <header className="h-16 px-4 sm:px-6 flex items-center">
        <LumeLogo size="md" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-lg flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="tabular-nums text-sm text-[var(--lume-text-muted)]">
              Errore {code}
            </span>
            <h1 className="text-3xl sm:text-4xl leading-tight font-medium tracking-tight text-balance">
              {title}
            </h1>
            <p className="text-base leading-relaxed text-[var(--lume-text-secondary)] max-w-[44ch]">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" trailingIcon={ArrowRight} onClick={goNow}>
              Vai ora
            </Button>
            {extraAction && (
              <Button variant="secondary" size="lg" leadingIcon={extraAction.icon} onClick={extraAction.onClick}>
                {extraAction.label}
              </Button>
            )}
          </div>

          <div
            aria-live="polite"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 border-t border-line text-sm text-[var(--lume-text-secondary)]"
          >
            {cancelled ? (
              <span>Reindirizzamento automatico annullato.</span>
            ) : (
              <>
                <span>
                  Tra <span className="tabular-nums text-[var(--lume-text)]">{remaining}</span>{' '}
                  {remaining === 1 ? 'secondo' : 'secondi'} si apre {destinationLabel}.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={X}
                  onClick={() => setCancelled(true)}
                  className="-mx-2 text-[var(--lume-text)] pointer-coarse:h-[var(--lume-control-h-lg)]"
                >
                  Resta qui
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
