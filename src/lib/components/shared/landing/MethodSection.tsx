'use client';

import { Calendar, Users, Package, BarChart3 } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

const features = [
  {
    icon: Calendar,
    title: 'Calendario visivo',
    description:
      'Visualizza e gestisci tutti gli appuntamenti in un calendario chiaro. Aggiungi, modifica o cancella in pochi secondi.',
  },
  {
    icon: Users,
    title: 'Schede clienti',
    description:
      'Ogni cliente ha la sua scheda completa: storico appuntamenti, note, preferenze e molto altro.',
  },
  {
    icon: Package,
    title: 'Magazzino e ordini',
    description:
      'Tieni traccia di prodotti, fornitori e ordini. Sai sempre cosa hai in stock e cosa devi ordinare.',
  },
  {
    icon: BarChart3,
    title: 'Bilancio e report',
    description:
      'Report chiari su guadagni, ore lavorate e andamento del salone. Prendi decisioni basate sui dati.',
  },
];

export function MethodSection() {
  return (
    <section id="funzionalita" className="py-24 px-4 bg-background">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="max-w-2xl mb-16" variants={itemVariants}>
          <div className="accent-line mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Tutto quello che serve, niente di superfluo.
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Progettato per chi lavora tutto il giorno in piedi e non ha tempo da perdere con
            software complicati.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} className="feature-card" variants={itemVariants}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
