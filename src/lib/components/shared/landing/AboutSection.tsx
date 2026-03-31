'use client';

import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

const steps = [
  {
    number: '01',
    title: 'Crea il tuo account',
    description: 'Registrati in meno di un minuto. Nessuna carta richiesta per iniziare.',
  },
  {
    number: '02',
    title: 'Aggiungi i tuoi dati',
    description: 'Inserisci operatori, servizi e clienti. Il processo è guidato e veloce.',
  },
  {
    number: '03',
    title: 'Inizia a gestire',
    description:
      'Calendario, schede clienti, magazzino — tutto operativo dal primo giorno.',
  },
];

export function AboutSection() {
  return (
    <section id="come-funziona" className="py-24 px-4 bg-white">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="max-w-2xl mb-16" variants={itemVariants}>
          <div className="accent-line mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-[#09090B] mb-4">
            Operativo in pochi minuti.
          </h2>
          <p className="text-zinc-500 text-lg">
            Nessuna formazione, nessun tecnico, nessuna attesa.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-10">
          {steps.map(({ number, title, description }) => (
            <motion.div key={number} variants={itemVariants}>
              <motion.span
                className="text-6xl font-bold text-[#E4E4E7] leading-none select-none block mb-2"
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
                }}
              >
                {number}
              </motion.span>
              <h3 className="font-semibold text-[#09090B] mb-2 text-lg">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
