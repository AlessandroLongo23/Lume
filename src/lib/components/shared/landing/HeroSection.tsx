import { ArrowRight, Check, Calendar, Users, Package, BarChart3 } from 'lucide-react';

const bullets = [
  'Calendario appuntamenti',
  'Schede clienti',
  'Magazzino e ordini',
  'Bilancio e statistiche',
];

const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

type ApptColor = 'indigo' | 'emerald' | 'amber';

type Appt = { name: string; service: string; color: ApptColor } | null;

const appointments: Appt[][] = [
  // row 0 — 9:00
  [
    { name: 'Marco R.', service: 'Taglio + Barba', color: 'indigo' },
    { name: 'Sofia B.', service: 'Piega', color: 'indigo' },
    null,
  ],
  // row 1 — 10:00
  [
    null,
    { name: 'Giulia M.', service: 'Colore', color: 'emerald' },
    { name: 'Roberto T.', service: 'Taglio', color: 'indigo' },
  ],
  // row 2 — 11:00
  [
    { name: 'Alessia V.', service: 'Trattamento', color: 'amber' },
    null,
    { name: 'Fabio C.', service: 'Taglio + Barba', color: 'indigo' },
  ],
];

const colorMap = {
  indigo: {
    bg: 'bg-[#6366F1]/10',
    border: 'border-[#6366F1]/20',
    name: 'text-[#6366F1]',
    service: 'text-zinc-400',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    name: 'text-emerald-700',
    service: 'text-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    name: 'text-amber-700',
    service: 'text-amber-500',
  },
};

function DashboardMockup() {
  const navIcons = [Calendar, Users, Package, BarChart3];

  return (
    <div className="relative w-full max-w-[580px] mx-auto lg:mx-0">
      {/* Glow behind the mockup */}
      <div className="absolute -inset-4 bg-[#6366F1]/8 rounded-2xl blur-2xl pointer-events-none" />

      {/* Browser window */}
      <div className="relative rounded-xl border border-[#E4E4E7] shadow-2xl overflow-hidden bg-white">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded-md bg-[#E4E4E7] flex items-center px-2.5">
            <span className="text-[10px] text-zinc-400">lumeapp.it/calendario</span>
          </div>
        </div>

        {/* App UI */}
        <div className="flex h-[340px] overflow-hidden">
          {/* Sidebar */}
          <div className="w-12 border-r border-[#E4E4E7] bg-[#FAFAFA] flex flex-col items-center py-3 gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center mb-1">
              <span className="text-white text-[11px] font-bold leading-none">L</span>
            </div>
            {navIcons.map((Icon, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  i === 0 ? 'bg-[#EEF2FF]' : ''
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${i === 0 ? 'text-[#6366F1]' : 'text-zinc-300'}`}
                />
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="flex-1 p-3 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-[#09090B]">Martedì, 1 Aprile</span>
              <div className="flex gap-0.5">
                {weekDays.map((d, i) => (
                  <div
                    key={d}
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                      i === 1
                        ? 'bg-[#6366F1] text-white'
                        : 'text-zinc-400'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Operator columns header */}
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {['Marco', 'Elena', 'Luca'].map((op) => (
                <div key={op} className="text-[9px] text-center text-zinc-400 font-medium">
                  {op}
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-1.5">
              {appointments.map((row, ri) => (
                <div key={ri} className="grid grid-cols-3 gap-1.5">
                  {row.map((appt, ci) =>
                    appt ? (
                      <div
                        key={ci}
                        className={`h-11 rounded-lg border p-1.5 ${colorMap[appt.color].bg} ${colorMap[appt.color].border}`}
                      >
                        <div className={`text-[9px] font-semibold leading-tight ${colorMap[appt.color].name}`}>
                          {appt.name}
                        </div>
                        <div className={`text-[9px] leading-tight ${colorMap[appt.color].service}`}>
                          {appt.service}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={ci}
                        className="h-11 rounded-lg border border-dashed border-[#E4E4E7]"
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Client panel */}
          <div className="w-40 border-l border-[#E4E4E7] p-3 bg-[#FAFAFA] shrink-0">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-bold">MR</span>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-[#09090B] truncate">Marco R.</div>
                <div className="text-[9px] text-zinc-400">Cliente da 3 anni</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="bg-white rounded-lg p-2 border border-[#E4E4E7]">
                <div className="text-[9px] text-zinc-400 mb-0.5">Ultimo appuntamento</div>
                <div className="text-[9px] font-medium text-[#09090B]">15 marzo — Taglio</div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-[#E4E4E7]">
                <div className="text-[9px] text-zinc-400 mb-0.5">Preferisce</div>
                <div className="text-[9px] font-medium text-[#09090B]">Scalato ai lati</div>
              </div>
              <div className="bg-[#EEF2FF] rounded-lg p-2">
                <div className="text-[9px] text-[#6366F1] font-semibold">12 visite totali</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HeroSectionProps {
  onAuthClick: () => void;
}

export function HeroSection({ onAuthClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 pb-24 px-4 overflow-hidden bg-white">
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E4E4E7] bg-white text-xs text-zinc-500 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
              Gestionale per parrucchieri e barbieri
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#09090B] leading-[1.05] mb-6">
              Il gestionale che
              <br />
              <span className="text-[#6366F1]">il tuo salone</span>
              <br />
              meritava.
            </h1>

            <p className="text-lg text-zinc-500 max-w-md mb-10 leading-relaxed">
              Lume elimina il caos da appuntamenti, clienti e magazzino — tutto in
              un&apos;unica app chiara e veloce. Meno clic, più tempo per i tuoi clienti.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
              <button
                onClick={onAuthClick}
                className="btn-primary px-6 py-3 text-base flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Inizia gratis <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#funzionalita"
                className="btn-secondary px-6 py-3 text-base flex w-full sm:w-auto justify-center items-center"
              >
                Scopri le funzionalità
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {bullets.map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <Check className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="hidden lg:flex justify-end items-center">
            <DashboardMockup />
          </div>
        </div>

        {/* Mobile mockup — shown below text on small screens */}
        <div className="lg:hidden mt-10 scale-75 origin-top">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
