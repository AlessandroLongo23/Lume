'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { cn } from '@/lib/utils';

/**
 * The page around every auth screen: a back link to the home, the logo, one
 * raised card and the copyright line. The (auth) route group renders it in
 * its layout; pages outside the group (change password) render it themselves.
 */
export function AuthShell({ children, backToHome = true }: { children: ReactNode; backToHome?: boolean }) {
  return (
    <div className="relative min-h-dvh bg-[var(--lume-bg)] text-[var(--lume-text)] flex flex-col">
      <header className="flex items-center justify-between h-16 px-4 sm:px-6">
        {backToHome && (
          <Button variant="ghost" size="lg" asChild className="-ml-2 px-2 text-sm font-normal">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Torna alla home
            </Link>
          </Button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-105">
          <div className="mb-8 flex justify-center">
            <LumeLogo size="lg" />
          </div>

          {/* CSS entrance (globals.css): it plays from the first paint, so the
              card and its title show before the JavaScript bundle has run. */}
          <div className="surface-card rounded-2xl p-6 sm:p-8 enter-rise [--enter-y:0.5rem]">
            {children}
          </div>

          <p className="text-center text-compact text-[var(--lume-text-muted)] mt-6">
            © {new Date().getFullYear()} Lume. Tutti i diritti riservati.
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * The content of one auth card: title, subtitle, the body, and an optional
 * line under it ("Non hai un account? …"). Every auth page starts here.
 */
export function AuthCard({
  title,
  subtitle,
  align = 'start',
  footer,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'start' | 'center';
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={cn('mb-6 enter-rise', align === 'center' && 'text-center')}>
        <h1 className="text-2xl font-medium tracking-tight text-[var(--lume-text)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--lume-text-secondary)] mt-1">{subtitle}</p>}
      </div>

      {children}

      {footer && (
        <p className="text-center text-sm text-[var(--lume-text-secondary)] mt-6 enter-fade [--enter-delay:350ms]">
          {footer}
        </p>
      )}
    </>
  );
}
