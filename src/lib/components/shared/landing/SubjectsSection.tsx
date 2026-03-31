// Repurposed as ComparisonSection — SubjectsSection name kept for import compatibility
const points = [
  { them: '€60 / mese', us: '€49 / mese' },
  { them: 'Interfaccia anni 2000', us: 'Design moderno e intuitivo' },
  { them: 'Formazione richiesta', us: 'Operativo in 5 minuti' },
  { them: 'Supporto lento', us: 'Supporto via email rapido' },
  { them: 'Aggiornamenti rari', us: 'Miglioramenti continui' },
];

export function SubjectsSection() {
  return (
    <section className="py-24 px-4 bg-[#FAFAFA] section-enter">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16 fade-up">
          <div className="flex justify-center mb-4">
            <div className="accent-line" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#09090B] mb-4">
            Perché cambiare adesso?
          </h2>
          <p className="text-zinc-500 text-lg">
            Il tuo attuale software è costoso, difficile da usare e fermo agli anni 2000. Lume è
            diverso.
          </p>
        </div>

        <div className="fade-up">
          <div className="grid grid-cols-3 text-sm font-medium mb-3 px-4">
            <span className="text-zinc-400">Quello che usi ora</span>
            <span className="text-center text-zinc-300">→</span>
            <span className="text-right text-[#6366F1]">Lume</span>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden">
            {points.map(({ them, us }, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 items-center px-4 py-4 text-sm ${
                  i < points.length - 1 ? 'border-b border-[#E4E4E7]' : ''
                }`}
              >
                <span className="text-zinc-400 line-through">{them}</span>
                <span className="text-center text-zinc-300">→</span>
                <span className="text-right font-medium text-[#09090B]">{us}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
