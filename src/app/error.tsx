'use client';

import { useEffect, useState } from 'react';
import { ErrorPageShell } from '@/lib/components/shared/ui/ErrorPageShell';

type SafeRedirect = { href: string; label: string };

const FALLBACK: SafeRedirect = { href: '/', label: 'la homepage' };

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dest, setDest] = useState<SafeRedirect | null>(null);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/safe-redirect', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : FALLBACK))
      .then((d: SafeRedirect) => {
        if (!cancelled) setDest(d);
      })
      .catch(() => {
        if (!cancelled) setDest(FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!dest) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center px-6 py-12 bg-[var(--lume-bg)] text-[var(--lume-text)]" />
    );
  }

  return (
    <ErrorPageShell
      code="500"
      title="Qualcosa è andato storto"
      description="Si è verificato un errore imprevisto. Puoi riprovare o tornare a una pagina sicura."
      destinationHref={dest.href}
      destinationLabel={dest.label}
      extraAction={{ label: 'Riprova', onClick: reset }}
    />
  );
}
