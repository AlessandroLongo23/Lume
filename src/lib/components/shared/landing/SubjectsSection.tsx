'use client';

import { Check } from 'lucide-react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';

const points = [
  { label: 'Prezzo', them: '€60 al mese', us: '€49 al mese' },
  { label: 'Interfaccia', them: 'Ferma agli anni 2000', us: 'Moderna e intuitiva' },
  { label: 'Per iniziare', them: 'Serve formazione', us: 'Operativo in 5 minuti' },
  { label: 'Assistenza', them: 'Lenta', us: 'Via email, rapida' },
  { label: 'Aggiornamenti', them: 'Rari', us: 'Miglioramenti continui' },
];

export function SubjectsSection() {
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
          <h2 className="lp-h2">Perché cambiare adesso?</h2>
          <p className="lp-lede">
            Il tuo software attuale è costoso, difficile da usare e fermo agli anni 2000. Lume è
            diverso.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">Confronto tra il tuo software attuale e Lume</caption>
            <thead>
              <tr className="text-compact text-[var(--lume-text-muted)]">
                <th scope="col" className="font-normal pt-4 pb-3 w-[28%] hidden sm:table-cell">
                  <span className="sr-only">Aspetto</span>
                </th>
                <th scope="col" className="font-normal pt-4 pb-3 pr-4">Quello che usi ora</th>
                <th scope="col" className="font-medium pt-4 pb-3 px-4 text-[var(--lume-accent)] bg-accent-soft rounded-t-xl">Lume</th>
              </tr>
            </thead>
            <tbody>
              {points.map(({ label, them, us }, i) => (
                <tr key={label} className="border-t border-line">
                  <th
                    scope="row"
                    className="font-normal py-4 pr-4 text-compact text-[var(--lume-text-muted)] hidden sm:table-cell"
                  >
                    {label}
                  </th>
                  <td className="py-4 pr-4 text-[length:var(--lp-text-body)] text-[var(--lume-text-secondary)]">
                    <span className="sm:hidden block text-2xs text-[var(--lume-text-muted)] mb-0.5">{label}</span>
                    {them}
                  </td>
                  <td
                    className={`py-4 px-4 text-[length:var(--lp-text-body)] text-[var(--lume-text)] bg-accent-soft max-sm:align-bottom ${
                      i === points.length - 1 ? 'rounded-b-xl' : ''
                    }`}
                  >
                    <span className="inline-flex items-start gap-2">
                      <Check aria-hidden className="size-4 mt-0.75 shrink-0 text-[var(--lume-accent)]" strokeWidth={2.25} />
                      {us}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </section>
  );
}
