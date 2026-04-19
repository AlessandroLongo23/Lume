'use client';

import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

const points = [
  { them: '€60 / mese', us: '€49 / mese' },
  { them: 'Interfaccia anni 2000', us: 'Design moderno e intuitivo' },
  { them: 'Formazione richiesta', us: 'Operativo in 5 minuti' },
  { them: 'Supporto lento', us: 'Supporto via email rapido' },
  { them: 'Aggiornamenti rari', us: 'Miglioramenti continui' },
];

export function SubjectsSection() {
  return (
    <section className="py-24 px-4 bg-background">
      <motion.div
        className="max-w-3xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <div className="flex justify-center mb-4">
            <div className="accent-line" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Perché cambiare adesso?
          </h2>
          <p className="text-zinc-500 text-lg">
            Il tuo attuale software è costoso, difficile da usare e fermo agli anni 2000. Lume è
            diverso.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-3 text-sm font-medium mb-3 px-4">
            <span className="text-zinc-400">Quello che usi ora</span>
            <span className="text-center text-zinc-300">→</span>
            <span className="text-right text-primary">Lume</span>
          </div>

          <div className="rounded-xl border border-border bg-white overflow-hidden">
            {points.map(({ them, us }, i) => (
              <motion.div
                key={i}
                className={`grid grid-cols-3 items-center px-4 py-4 text-sm ${
                  i < points.length - 1 ? 'border-b border-border' : ''
                }`}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4, delay: i * 0.08 },
                  },
                }}
              >
                <span className="text-zinc-400 line-through">{them}</span>
                <span className="text-center text-zinc-300">→</span>
                <span className="text-right font-medium text-foreground">{us}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
