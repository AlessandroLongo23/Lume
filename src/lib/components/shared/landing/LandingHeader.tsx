'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { Button } from '@/lib/components/shared/ui/Button';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  session: Session | null;
}

const NAV = [
  { href: '#funzionalita', label: 'Funzionalità' },
  { href: '#come-funziona', label: 'Come funziona' },
  { href: '#prezzi', label: 'Prezzi' },
  { href: '#domande', label: 'Domande' },
];

export function LandingHeader({ session }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-header border-b transition-[background-color,border-color] duration-[var(--duration-base)]',
        scrolled
          ? 'bg-[color-mix(in_oklab,var(--lume-bg)_88%,transparent)] backdrop-blur-md border-line'
          : 'bg-[var(--lume-bg)] border-line',
      )}
    >
      <div className="lp-container h-16 flex items-center gap-8">
        <Link
          href="/"
          aria-label="Lume, pagina iniziale"
          className="rounded-md text-[var(--lume-text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lume-ring-focus)]"
        >
          <LumeLogo size="md" />
        </Link>

        <nav aria-label="Sezioni" className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              // ds-ignore: a link in the landing header's nav bar, not a row in a list
              className="h-9 px-3 inline-flex items-center rounded-md text-sm text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] hover:bg-hover transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Button variant="ghost" size="md" leadingIcon={LogOut}
                onClick={async () => {
                  await fetch('/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
              >
                Esci
              </Button>
              <Button variant="secondary" size="md" asChild>
                <Link href="/dashboard">Vai al gestionale</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" asChild>
                <Link href="/login">Accedi</Link>
              </Button>
              <Button variant="secondary" size="md" asChild className="hidden sm:inline-flex">
                <Link href="/register">Prova gratis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
