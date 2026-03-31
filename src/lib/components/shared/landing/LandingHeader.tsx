'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';

interface LandingHeaderProps {
  session: Session | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export function LandingHeader({ session, onLoginClick, onRegisterClick }: LandingHeaderProps) {
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
          ? 'bg-white/95 backdrop-blur-sm border-b border-[#E4E4E7] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight text-[#09090B]">Lume</span>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#funzionalita" className="text-sm text-zinc-500 hover:text-[#09090B] transition-colors">
            Funzionalità
          </a>
          <a href="#come-funziona" className="text-sm text-zinc-500 hover:text-[#09090B] transition-colors">
            Come funziona
          </a>
          <a href="#prezzi" className="text-sm text-zinc-500 hover:text-[#09090B] transition-colors">
            Prezzi
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/admin/calendario" className="btn-primary text-sm px-4 py-2">
              Dashboard →
            </Link>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="hidden sm:block text-sm text-zinc-500 hover:text-[#09090B] transition-colors"
              >
                Accedi
              </button>
              <button onClick={onRegisterClick} className="btn-primary text-sm px-4 py-2">
                Inizia gratis
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
