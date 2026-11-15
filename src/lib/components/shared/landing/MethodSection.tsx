'use client';

import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';
import { BarChart3, Calendar, Package, Users } from 'lucide-react';
import { MiniWeek, MiniClient, MiniStock, MiniBalance } from './ProductMocks';

const features = [
  {
    title: 'Calendario visivo',
    description:
      'Tutti gli appuntamenti in un calendario chiaro. Aggiungi, sposta o cancella in pochi secondi.',
    Visual: MiniWeek,
    Icon: Calendar,
    tone: 'indigo',
  },
  {
    title: 'Schede clienti',
    description:
      'Ogni cliente ha la sua scheda: storico degli appuntamenti, note e preferenze.',
    Visual: MiniClient,
    Icon: Users,
    tone: 'indigo',
  },
  {
    title: 'Magazzino e ordini',
    description:
      'Prodotti, fornitori e ordini in un posto solo. Sai sempre cosa hai e cosa devi ordinare.',
    Visual: MiniStock,
    Icon: Package,
    tone: 'brass',
  },
  {
    title: 'Bilancio e report',
    description:
      'Report chiari su guadagni, ore lavorate e andamento del salone.',
    Visual: MiniBalance,
    Icon: BarChart3,
    tone: 'brass',
  },
];

export function MethodSection() {
  return (
    <section id="funzionalita" className="lp-section lp-rule scroll-mt-16">
      <motion.div
        className="lp-container"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="lp-split" variants={itemVariants}>
          <h2 className="lp-h2">Tutto quello che serve, niente di superfluo.</h2>
          <p className="lp-lede">
            Progettato per chi lavora tutto il giorno in piedi e non ha tempo da perdere con
            software complicati.
          </p>
        </motion.div>

        <div className="lp-bento">
          {features.map(({ title, description, Visual, Icon, tone }) => (
            <motion.article key={title} className="lp-tile lp-span-3" variants={itemVariants}>
              <div className="lp-tile-vis" aria-hidden="true">
                <Visual />
              </div>
              <div className="flex flex-col gap-1.5 p-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="lp-icon" data-tone={tone} aria-hidden="true">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <h3 className="lp-h3">{title}</h3>
                </div>
                <p className="lp-body max-w-[46ch]">{description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
