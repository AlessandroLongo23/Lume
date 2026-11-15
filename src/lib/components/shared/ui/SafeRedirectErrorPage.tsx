'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { ErrorPageShell } from '@/lib/components/shared/ui/ErrorPageShell';

type SafeRedirect = { href: string; label: string };

const FALLBACK: SafeRedirect = { href: '/', label: 'la homepage' };

type SafeRedirectErrorPageProps = Omit<
  ComponentProps<typeof ErrorPageShell>,
  'destinationHref' | 'destinationLabel'
>;

/**
 * ErrorPageShell whose destination comes from /api/safe-redirect, resolved in
 * the browser. The root not-found boundary is rendered inside every route, so
 * resolving the destination on the server there (it reads the auth cookies)
 * made every page in the app dynamic.
 */
export function SafeRedirectErrorPage(props: SafeRedirectErrorPageProps) {
  const [dest, setDest] = useState<SafeRedirect | null>(null);

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
    <ErrorPageShell {...props} destinationHref={dest.href} destinationLabel={dest.label} />
  );
}
