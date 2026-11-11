'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/lib/components/shared/ui/Button';
import './globals.css';

// Replaces the root layout when it fails, so it loads the global styles itself
// (tokens included). Geist is not loaded here: the system sans stands in.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="it">
      <body
        className="min-h-dvh flex items-center justify-center px-4 py-12 bg-[var(--lume-bg)] text-[var(--lume-text)]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <title>Qualcosa è andato storto · Lume</title>
        <main className="w-full max-w-lg flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="tabular-nums text-sm text-[var(--lume-text-muted)]">Errore 500</span>
            <h1 className="text-3xl sm:text-4xl leading-tight font-medium tracking-tight text-balance">
              Qualcosa è andato storto
            </h1>
            <p className="text-base leading-relaxed text-[var(--lume-text-secondary)]">
              Si è verificato un errore critico. Prova a ricaricare la pagina o torna alla homepage.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" onClick={reset}>
              Ricarica
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/">Torna alla homepage</Link>
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
