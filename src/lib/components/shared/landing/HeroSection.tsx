'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from './motion';
import { Button } from '@/lib/components/shared/ui/Button';
import { WindowFrame, CalendarScreen } from './ProductMocks';

const ease = [0.2, 0, 0, 1] as const;

interface HeroSectionProps {
  onAuthClick: () => void;
}

export function HeroSection({ onAuthClick }: HeroSectionProps) {
  return (
    <section className="relative pt-16 md:pt-28">
      <div className="lp-container grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:items-start">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="lp-display text-[var(--lume-text)]"
        >
          Il gestionale che il tuo salone merita.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.08 }}
          className="flex flex-col gap-6 lg:items-end lg:text-right lg:pt-3"
        >
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
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.18 }}
        className="lp-hero-stage lp-bleed mt-6 md:mt-8 pt-10 md:pt-14 pb-16 md:pb-24"
      >
        <WindowFrame url="lumeapp.it/admin/calendario" className="max-sm:h-75">
          <CalendarScreen />
        </WindowFrame>
      </motion.div>
    </section>
  );
}
