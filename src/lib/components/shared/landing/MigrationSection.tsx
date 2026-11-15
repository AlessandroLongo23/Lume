'use client';

import { ShieldCheck } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

const steps = [
  {
    title: 'Esporta dal vecchio software',
    description:
      'Dal tuo gestionale attuale esporta i dati dei clienti in un formato standard, CSV o Excel.',
  },
  {
    title: 'Carica il file su Lume',
    description:
      'Caricalo nella sezione di importazione. Ci pensiamo noi a leggere e organizzare tutto.',
  },
  {
    title: 'Sei già a casa',
    description:
      'Clienti, storico e note sono pronti nel tuo nuovo gestionale.',
  },
];

export function MigrationSection() {
  return (
    <section className="lp-section">
      <motion.div
        className="lp-container"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="lp-split" variants={itemVariants}>
          <h2 className="lp-h2">Anni di lavoro? Li porti con te.</h2>
          <p className="lp-lede">
            Cambiare strumento fa paura: anni di clienti, appuntamenti e preferenze accumulati con
            fatica. Con l&apos;importazione di Lume porti tutto con te in pochi minuti.
          </p>
        </motion.div>

        <motion.ol className="lp-cols" variants={itemVariants}>
          {steps.map(({ title, description }, i) => (
            <li key={title} className="flex flex-col gap-3 px-1 py-7 md:px-7 md:py-8 md:min-h-50">
              <span className="tabular-nums text-xs text-[var(--lume-accent)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="lp-h3 md:mt-8">{title}</h3>
              <p className="lp-body">{description}</p>
            </li>
          ))}
        </motion.ol>

        <motion.div
          className="mt-10 flex items-start gap-4 max-w-160"
          variants={itemVariants}
        >
          <ShieldCheck
            aria-hidden
            className="size-5 mt-0.5 shrink-0 text-success-strong"
            strokeWidth={1.75}
          />
          <p className="lp-body">
            <span className="text-[var(--lume-text)] font-medium">I tuoi dati restano tuoi, sempre.</span>{' '}
            Tutto quello che hai costruito in anni di lavoro arriva su Lume intatto: nessun dato va
            perso, nessun cliente viene dimenticato.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
