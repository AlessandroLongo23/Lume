'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { WindowFrame, CalendarScreen } from './ProductMocks';

interface HeroSectionProps {
  onAuthClick: () => void;
}

// The entrance is CSS (`enter-rise` in globals.css): it plays from the first
// paint, so the headline, the page's largest element, shows without waiting
// for the JavaScript bundle.
export function HeroSection({ onAuthClick }: HeroSectionProps) {
  return (
    <section className="relative pt-16 md:pt-28">
      <div className="lp-container grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:items-start">
        <h1 className="lp-display text-[var(--lume-text)] enter-rise">
          Il gestionale che il tuo salone merita.
        </h1>

        <div className="flex flex-col gap-6 lg:items-end lg:text-right lg:pt-3 enter-rise [--enter-delay:80ms]">
          <p className="lp-lede max-w-110">
            Appuntamenti, clienti e magazzino in un&apos;unica app chiara e veloce. Meno clic, più
            tempo per i tuoi clienti.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="primary" size="lg" trailingIcon={ArrowRight} onClick={onAuthClick}>
              Inizia gratis
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="#come-funziona">Come funziona</a>
            </Button>
          </div>
          <p className="text-compact text-[var(--lume-text-muted)]">
            30 giorni gratuiti, nessuna carta richiesta.
          </p>
        </div>
      </div>

      <div className="lp-hero-stage lp-bleed mt-6 md:mt-8 pt-10 md:pt-14 pb-16 md:pb-24 enter-rise [--enter-delay:180ms] [--enter-y:1.5rem]">
        <WindowFrame url="lumeapp.it/admin/calendario" className="max-sm:h-75">
          <CalendarScreen />
        </WindowFrame>
      </div>
    </section>
  );
}
