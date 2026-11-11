'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { motion, itemVariants, sectionVariants, viewportConfig } from './motion';
import { WindowFrame, AccountScreen, DataScreen, CalendarCompact } from './ProductMocks';
import { cn } from '@/lib/utils';
import { DURATION } from '@/lib/const/motion';

const steps = [
  {
    title: 'Crea il tuo account',
    description: 'Registrati in meno di un minuto. Nessuna carta richiesta per iniziare.',
    url: 'lumeapp.it/register',
    Screen: AccountScreen,
  },
  {
    title: 'Aggiungi i tuoi dati',
    description: 'Inserisci operatori, servizi e clienti. Il processo è guidato e veloce.',
    url: 'lumeapp.it/admin/servizi',
    Screen: DataScreen,
  },
  {
    title: 'Inizia a gestire',
    description: 'Calendario, schede clienti e magazzino sono operativi dal primo giorno.',
    url: 'lumeapp.it/admin/calendario',
    Screen: CalendarCompact,
  },
];

export function AboutSection() {
  const [open, setOpen] = useState(0);
  const baseId = useId();
  const { Screen, url } = steps[open];

  return (
    <section id="come-funziona" className="lp-section scroll-mt-16">
      <motion.div
        className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:items-center"
        style={{ paddingLeft: 'var(--lp-edge)' }}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div
          className="flex flex-col gap-8 min-w-0"
          style={{ paddingRight: 'var(--lp-pad)' }}
          variants={itemVariants}
        >
          <div className="flex flex-col gap-4">
            <h2 className="lp-h2">Operativo in pochi minuti.</h2>
            <p className="lp-lede">Nessuna formazione, nessun tecnico, nessuna attesa.</p>
          </div>

          <div className="border-t border-line">
            {steps.map((step, i) => {
              const isOpen = open === i;
              const panelId = `${baseId}-panel-${i}`;
              const buttonId = `${baseId}-button-${i}`;
              return (
                <div key={step.title} className="lp-acc-item" data-open={isOpen}>
                  <h3>
                    <button
                      // ds-ignore: accordion trigger, a full-width heading row (step number, title, chevron) inside an h3; Button is a fixed-height centred control
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(i)}
                      className={cn(
                        'w-full min-h-14 py-4 flex items-center gap-4 text-left rounded-sm',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
                      )}
                    >
                      <span
                        className={cn(
                          'tabular-nums text-xs transition-colors',
                          isOpen ? 'text-[var(--lume-accent)]' : 'text-[var(--lume-text-muted)]',
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={cn(
                          'flex-1 lp-h3 transition-colors',
                          isOpen ? 'text-[var(--lume-text)]' : 'text-[var(--lume-text-secondary)]',
                        )}
                      >
                        {step.title}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={cn(
                          'size-4 text-[var(--lume-text-muted)] transition-transform duration-[var(--duration-base)] motion-reduce:transition-none',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="lp-acc-body"
                    data-open={isOpen}
                    aria-hidden={!isOpen}
                  >
                    <div>
                      <p className="lp-body pb-5 pl-9 max-w-[42ch]">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="lp-hero-stage min-w-0 py-10" variants={itemVariants}>
          <WindowFrame url={url}>
            <div className="relative h-75 sm:h-100 md:h-114 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={open}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DURATION.base }}
                  className="absolute inset-0 max-sm:[zoom:0.7]"
                >
                  <Screen />
                </motion.div>
              </AnimatePresence>
            </div>
          </WindowFrame>
        </motion.div>
      </motion.div>
    </section>
  );
}
