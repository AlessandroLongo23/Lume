'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

const included = [
  'Calendario appuntamenti',
  'Schede clienti illimitate',
  'Gestione operatori',
  'Prodotti e magazzino',
  'Servizi e listino prezzi',
  'Ordini fornitori',
  'Bilancio e statistiche',
  'Assistenza via email',
];

interface MarqueeStripProps {
  onAuthClick: () => void;
}

export function MarqueeStrip({ onAuthClick }: MarqueeStripProps) {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="prezzi" className="py-24 px-4 bg-white section-enter">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 fade-up">
          <div className="flex justify-center mb-4">
            <div className="accent-line" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#09090B] mb-4">
            Un prezzo semplice. Tutto incluso.
          </h2>
          <p className="text-zinc-500 text-lg">
            Meno di quello che paghi adesso, con molto di più.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10 fade-up">
          <span className={`text-sm font-medium ${!yearly ? 'text-[#09090B]' : 'text-zinc-400'}`}>
            Mensile
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              yearly ? 'bg-[#6366F1]' : 'bg-[#E4E4E7]'
            }`}
            aria-label="Passa a fatturazione annuale"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                yearly ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-[#09090B]' : 'text-zinc-400'}`}>
            Annuale
            <span className="ml-2 text-xs text-[#6366F1] font-semibold bg-[#EEF2FF] px-1.5 py-0.5 rounded-full">
              2 mesi gratis
            </span>
          </span>
        </div>

        {/* Card */}
        <div className="max-w-sm mx-auto fade-up">
          <div className="pricing-card featured">
            <div className="mb-6">
              <p className="text-sm font-medium text-zinc-500 mb-1">Piano unico — tutto incluso</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-[#09090B]">
                  €{yearly ? '490' : '49'}
                </span>
                <span className="text-zinc-400 text-sm">/ {yearly ? 'anno' : 'mese'}</span>
              </div>
              {yearly && (
                <p className="text-sm text-[#6366F1] mt-1 font-medium">
                  Risparmi €98 rispetto al mensile
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#09090B]">
                  <Check className="w-4 h-4 text-[#6366F1] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onAuthClick}
              className="btn-primary w-full py-3 text-sm font-medium"
            >
              Inizia gratis
            </button>
            <p className="text-center text-xs text-zinc-400 mt-3">Nessuna carta richiesta</p>
          </div>
        </div>
      </div>
    </section>
  );
}
