'use client';

import { Plus } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

/* Answers restate what the rest of the page already says; no new promises. */
const faqs = [
  {
    q: 'Quanto costa Lume?',
    a: '€49 al mese, oppure €490 all’anno con 2 mesi gratis. Un piano unico con tutto incluso.',
  },
  {
    q: 'Serve una carta di credito per provarlo?',
    a: 'No. Hai 30 giorni gratuiti e per iniziare non serve nessuna carta.',
  },
  {
    q: 'Posso portare i clienti dal mio gestionale attuale?',
    a: 'Sì. Esporta i dati dal vecchio software in CSV o Excel e caricali nella sezione di importazione: Lume legge e organizza clienti, storico e note.',
  },
  {
    q: 'Devo seguire un corso per usarlo?',
    a: 'No. Lume è pensato per essere chiaro dal primo giorno: nessuna formazione, nessun tecnico.',
  },
  {
    q: 'Come contatto l’assistenza?',
    a: 'Scrivici a info@lumeapp.it: l’assistenza via email è inclusa nel piano.',
  },
];

export function FaqSection() {
  return (
    <section id="domande" className="lp-section scroll-mt-16">
      <motion.div
        className="lp-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.h2 className="lp-h2" variants={itemVariants}>
          Domande frequenti
        </motion.h2>

        <motion.div className="border-t border-line" variants={itemVariants}>
          {faqs.map(({ q, a }) => (
            <details key={q} className="lp-faq group border-b border-line">
              <summary className="flex items-center gap-4 min-h-14 py-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]">
                <span className="flex-1 lp-h3 text-[var(--lume-text)]">{q}</span>
                <Plus aria-hidden className="lp-faq-ic size-4 shrink-0 text-[var(--lume-text-muted)]" />
              </summary>
              <p className="lp-body pb-5 max-w-[60ch]">{a}</p>
            </details>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
