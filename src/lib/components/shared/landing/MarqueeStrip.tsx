'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';
import { Button } from '@/lib/components/shared/ui/Button';

const included = [
  'Calendario appuntamenti',
  'Schede clienti illimitate',
  'Gestione operatori',
  'Prodotti e magazzino',
  'Servizi e listino prezzi',
  'Ordini fornitori',
  'Bilancio e statistiche',
  'Assistenza via email',
];

interface MarqueeStripProps {
  onAuthClick: () => void;
}

export function MarqueeStrip({ onAuthClick }: MarqueeStripProps) {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="prezzi" className="py-24 px-4 bg-white">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="text-center max-w-2xl mx-auto mb-12" variants={itemVariants}>
          <div className="flex justify-center mb-4">
            <div className="accent-line" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Un prezzo semplice. Tutto incluso.
          </h2>
          <p className="text-zinc-500 text-lg">
            Meno di quello che paghi adesso, con molto di più.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div className="flex items-center justify-center gap-4 mb-10" variants={itemVariants}>
          <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-zinc-400'}`}>
            Mensile
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              yearly ? 'bg-primary' : 'bg-border'
            }`}
            aria-label="Passa a fatturazione annuale"
          >
            <motion.span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ x: yearly ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-zinc-400'}`}>
            Annuale
            <span className="ml-2 text-xs text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
              2 mesi gratis
            </span>
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          className="max-w-sm mx-auto"
          variants={{
            hidden: { opacity: 0, y: 24, scale: 0.97 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 } },
          }}
        >
          <div className="pricing-card featured">
            <div className="mb-6">
              <p className="text-sm font-medium text-zinc-500 mb-1">Piano unico — tutto incluso</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">
                  €{yearly ? '490' : '49'}
                </span>
                <span className="text-zinc-400 text-sm">/ {yearly ? 'anno' : 'mese'}</span>
              </div>
              {yearly && (
                <p className="text-sm text-primary mt-1 font-medium">
                  Risparmi €98 rispetto al mensile
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="primary" fullWidth onClick={onAuthClick}>
              Inizia gratis
            </Button>
            <p className="text-center text-xs text-zinc-400 mt-3">Nessuna carta richiesta</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
