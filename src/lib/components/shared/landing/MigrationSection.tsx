'use client';

import { Download, Upload, CheckCircle, Shield } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

const steps = [
  {
    number: '01',
    icon: Download,
    title: 'Esporta dal vecchio software',
    description: 'Dal tuo attuale gestionale, esporta i dati clienti nel formato standard (CSV o Excel).',
  },
  {
    number: '02',
    icon: Upload,
    title: 'Carica su Lume',
    description: 'Carica il file nella sezione Import di Lume. Ci pensiamo noi a leggere e organizzare tutto.',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Sei già a casa',
    description: 'Tutti i tuoi clienti, il loro storico e le note sono pronti nel tuo nuovo salone digitale.',
  },
];

export function MigrationSection() {
  return (
    <section className="py-24 px-4 bg-white">
      <motion.div
        className="max-w-5xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        {/* Header */}
        <motion.div className="max-w-xl mb-16" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background text-xs text-zinc-500 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Cambio senza paura
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            Anni di lavoro?
            <br />
            <span className="text-primary">Li porti con te.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Sappiamo che cambiare strumento fa paura. Anni di clienti, appuntamenti, preferenze — tutto accumulato con fatica. Con Lume non perdi niente: il nostro strumento di importazione porta tutto con te in pochi minuti.
          </p>
        </motion.div>

        {/* Steps — desktop */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-8 mb-12">
          {steps.map(({ number, icon: Icon, title, description }, i) => (
            <motion.div
              key={number}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, delay: i * 0.15 },
                },
              }}
            >
              {/* Icon + number + connector line */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-border ml-3 shrink-0">{number}</span>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-border ml-4" aria-hidden="true" />
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>

        {/* Steps — mobile */}
        <div className="flex flex-col gap-8 sm:hidden mb-12">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <motion.div key={number} className="flex flex-col items-start" variants={itemVariants}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-2xl font-bold text-border">{number}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>

        {/* Reassurance callout */}
        <motion.div
          className="rounded-2xl bg-primary/10 border border-primary/20 p-6 flex items-start gap-4"
          variants={itemVariants}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              I tuoi dati restano tuoi — sempre.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Clienti, storico appuntamenti, note, preferenze. Tutto quello che hai costruito in anni di lavoro arriva su Lume intatto. Nessun dato va perso, nessun cliente si dimentica.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
