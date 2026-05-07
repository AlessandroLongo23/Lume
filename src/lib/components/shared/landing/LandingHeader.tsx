'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, LogIn, LogOut } from 'lucide-react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { Button } from '@/lib/components/shared/ui/Button';

interface LandingHeaderProps {
  session: Session | null;
}

export function LandingHeader({ session }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-header transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <LumeLogo size="md" />

        <nav className="hidden md:flex items-center gap-8">
          <a href="#funzionalita" className="text-sm text-zinc-500 hover:text-foreground transition-colors">
            Funzionalità
          </a>
          <a href="#come-funziona" className="text-sm text-zinc-500 hover:text-foreground transition-colors">
            Come funziona
          </a>
          <a href="#prezzi" className="text-sm text-zinc-500 hover:text-foreground transition-colors">
            Prezzi
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Button variant="primary" size="md" asChild>
                <a href="/dashboard">
                  <LogIn className="size-4" aria-hidden />
                  Dashboard
                </a>
              </Button>

              <Button
                variant="secondary"
                size="md"
                leadingIcon={LogOut}
                onClick={async () => {
                  await fetch('/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
                aria-label="Esci"
              >
                Esci
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" className="hidden sm:inline-flex" asChild>
                <Link href="/login">
                  <LogIn className="size-4" aria-hidden />
                  Accedi
                </Link>
              </Button>
              <Button variant="primary" size="md" asChild>
                <Link href="/register">
                  Inizia gratis
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
