'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
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
            <Link href="/admin/calendario" className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-sm text-zinc-500 hover:text-foreground transition-colors"
              >
                Accedi
              </Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2">
                Inizia gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
