'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';
import { Button } from '@/lib/components/shared/ui/Button';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';

const included = [
  'Calendario appuntamenti',
  'Schede clienti illimitate',
  'Gestione operatori',
  'Prodotti e magazzino',
  'Servizi e listino prezzi',
  'Ordini ai fornitori',
  'Bilancio e statistiche',
  'Assistenza via email',
];

type Billing = 'mensile' | 'annuale';

interface MarqueeStripProps {
  onAuthClick: () => void;
}

/** Pricing. The file keeps its historical name so imports stay stable. */
export function MarqueeStrip({ onAuthClick }: MarqueeStripProps) {
  const [billing, setBilling] = useState<Billing>('mensile');
  const yearly = billing === 'annuale';

  return (
    <section id="prezzi" className="lp-section scroll-mt-16">
      <motion.div
        className="lp-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="flex flex-col gap-4" variants={itemVariants}>
          <h2 className="lp-h2">Un prezzo semplice. Tutto incluso.</h2>
          <p className="lp-lede max-w-105">
            Meno di quello che paghi adesso, con molto di più.
          </p>
        </motion.div>

        <motion.div
          // ds-ignore: the one pricing plan, marked by an indigo double ring and a drop shadow at 24px radius; surface-card is the neutral hairline card
          className="rounded-2xl bg-[var(--lume-surface-raised)] shadow-[inset_0_0_0_1px_var(--lume-accent),inset_0_0_0_5px_var(--lume-accent-muted),0_24px_48px_-28px_var(--shadow-color)] p-6 sm:p-8 flex flex-col gap-7"
          variants={itemVariants}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-[var(--lume-text-secondary)]">Piano unico, tutto incluso</span>
            <ToggleButton
              options={['mensile', 'annuale']}
              labels={['Mensile', 'Annuale']}
              value={billing}
              onChange={(v: Billing) => setBilling(v)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="tabular-nums text-5xl sm:text-6xl font-light tracking-tight text-[var(--lume-text)]">
                €{yearly ? '490' : '49'}
              </span>
              <span className="text-[length:var(--lp-text-body)] text-[var(--lume-text-secondary)]">
                {yearly ? 'all’anno' : 'al mese'}
              </span>
            </div>
            <p className="flex items-center gap-2 text-compact text-[var(--lume-text-secondary)]" aria-live="polite">
              <span className="size-1.5 rounded-full bg-[var(--lume-chart-uscite)]" aria-hidden="true" />
              {yearly
                ? '2 mesi gratis: risparmi €98 rispetto al mensile.'
                : 'Oppure €490 all’anno, con 2 mesi gratis.'}
            </p>
          </div>

          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 pt-6 border-t border-line">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--lume-text)]">
                <Check aria-hidden className="size-4 mt-0.5 shrink-0 text-[var(--lume-accent)]" strokeWidth={2.25} />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" className="w-full" onClick={onAuthClick}>
              Inizia gratis
            </Button>
            <p className="text-center text-compact text-[var(--lume-text-muted)]">
              30 giorni gratuiti, nessuna carta richiesta.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
