import { Download, Upload, CheckCircle, Shield } from 'lucide-react';

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
    <section className="py-24 px-4 bg-white section-enter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16 fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E4E4E7] bg-[#FAFAFA] text-xs text-zinc-500 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
            Cambio senza paura
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#09090B] leading-tight mb-4">
            Anni di lavoro?
            <br />
            <span className="text-[#6366F1]">Li porti con te.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Sappiamo che cambiare strumento fa paura. Anni di clienti, appuntamenti, preferenze — tutto accumulato con fatica. Con Lume non perdi niente: il nostro strumento di importazione porta tutto con te in pochi minuti.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-8 mb-12 fade-up">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative">
              {/* Connector line (between steps on desktop) */}
              <div className="hidden sm:block absolute top-6 left-[calc(50%+32px)] right-[calc(-50%+32px)] h-px bg-[#E4E4E7]" aria-hidden="true" />

              <div className="relative flex flex-col items-start">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <span className="text-2xl font-bold text-[#E4E4E7]">{number}</span>
                </div>
                <h3 className="font-semibold text-[#09090B] mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reassurance callout */}
        <div className="rounded-2xl bg-[#6366F1]/4 border border-[#6366F1]/12 p-6 flex items-start gap-4 fade-up">
          <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div>
            <p className="font-semibold text-[#09090B] mb-1">
              I tuoi dati restano tuoi — sempre.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Clienti, storico appuntamenti, note, preferenze. Tutto quello che hai costruito in anni di lavoro arriva su Lume intatto. Nessun dato va perso, nessun cliente si dimentica.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
