'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, itemVariants, viewportConfig } from './motion';
import { Button } from '@/lib/components/shared/ui/Button';

interface CtaSectionProps {
  onAuthClick: () => void;
}

export function CtaSection({ onAuthClick }: CtaSectionProps) {
  return (
    <section className="lp-section">
      <motion.div
        className="lp-container"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={itemVariants}
      >
        <div className="lp-cta-wash rounded-2xl shadow-[inset_0_0_0_1px_var(--lume-line)] px-6 py-10 sm:px-12 sm:py-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 max-w-140">
            <h2 className="lp-h2">Prova Lume nel tuo salone.</h2>
            <p className="lp-lede">30 giorni gratuiti, nessuna carta richiesta. Operativo in pochi minuti.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" trailingIcon={ArrowRight} onClick={onAuthClick}>
              Inizia gratis
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/login">Accedi</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
