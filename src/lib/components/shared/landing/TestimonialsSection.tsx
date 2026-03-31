'use client';

import { Star, Quote } from 'lucide-react';
import { motion, itemVariants, viewportConfig } from './motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  salon: string;
  city: string;
  quote: string;
  stars: number;
}

const row1: Testimonial[] = [
  {
    id: 1,
    name: 'Francesca Moretti',
    role: 'Titolare',
    salon: 'Atelier Capelli',
    city: 'Milano',
    quote:
      'Usavamo il vecchio gestionale da 6 anni. Pensavo che cambiare sarebbe stato un incubo, invece con Lume in mezza giornata eravamo operativi. Le ragazze lo adorano.',
    stars: 5,
  },
  {
    id: 2,
    name: 'Marco Ferretti',
    role: 'Titolare',
    salon: 'Barbershop Ferretti',
    city: 'Roma',
    quote:
      'Finalmente un gestionale che non sembra uscito dal 2005. I clienti ricevono il promemoria, io vedo tutto dal telefono. Pagavo €60 al mese per un software che odiavo.',
    stars: 5,
  },
  {
    id: 3,
    name: 'Giulia Esposito',
    role: 'Responsabile',
    salon: 'Studio G Hair',
    city: 'Napoli',
    quote:
      'Il calendario è una rivoluzione. Vedo tutti gli operatori in un colpo d\'occhio, sposto appuntamenti con un drag, e la scheda cliente si apre con un clic.',
    stars: 5,
  },
  {
    id: 4,
    name: 'Alessandro Bianchi',
    role: 'Titolare',
    salon: 'Bianchi Barbers',
    city: 'Torino',
    quote:
      'Con due sedi aperte, avevo bisogno di qualcosa di chiaro per gestire tutto. Lume mi dà i numeri in tempo reale: incassi, servizi più richiesti, prodotti da riordinare.',
    stars: 5,
  },
  {
    id: 5,
    name: 'Elena Conti',
    role: 'Titolare',
    salon: 'Maison Elena',
    city: 'Bologna',
    quote:
      'Ho convinto anche le mie colleghe a provarlo. Tutte passate a Lume nel giro di un mese. La gestione del magazzino da sola vale l\'abbonamento.',
    stars: 5,
  },
];

const row2: Testimonial[] = [
  {
    id: 6,
    name: 'Davide Russo',
    role: 'Titolare',
    salon: 'The Blade Room',
    city: 'Firenze',
    quote:
      'Sono un barbiere, non un informatico. Mi serviva qualcosa che funzionasse e basta. Lume fa esattamente quello: apri, clicchi, fatto. Nessun manuale necessario.',
    stars: 5,
  },
  {
    id: 7,
    name: 'Sara Marchetti',
    role: 'Co-titolare',
    salon: 'Onde Salon',
    city: 'Verona',
    quote:
      'La cosa che mi ha conquistato è la scheda cliente. Ogni preferenza, ogni nota, ogni trattamento passato — tutto salvato. I clienti si sentono seguiti e tornano.',
    stars: 5,
  },
  {
    id: 8,
    name: 'Roberto Galli',
    role: 'Titolare',
    salon: 'Galli Style',
    city: 'Palermo',
    quote:
      'Prima scrivevo gli appuntamenti su un\'agenda di carta. Mia figlia mi ha fatto provare Lume e non sono più tornato alla carta. A 58 anni, se ci riesco io ci riesce chiunque.',
    stars: 5,
  },
  {
    id: 9,
    name: 'Valentina Ricci',
    role: 'Titolare',
    salon: 'VR Beauty Lab',
    city: 'Genova',
    quote:
      'L\'assistenza è incredibile. Ho scritto una sera alle 22 per un dubbio e mi hanno risposto in dieci minuti. Con il vecchio software aspettavo giorni.',
    stars: 5,
  },
  {
    id: 10,
    name: 'Luca De Santis',
    role: 'Titolare',
    salon: 'Taglio & Stile',
    city: 'Bari',
    quote:
      'I miei clienti mi chiedono come faccio a ricordarmi tutto. Il segreto è Lume: apro la scheda e so esattamente cosa hanno fatto l\'ultima volta. Fa sembrare tutto magico.',
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.name
    .split(' ')
    .map((p) => p[0])
    .join('');

  return (
    <div className="w-[340px] sm:w-[380px] shrink-0 rounded-2xl border border-[#E4E4E7] bg-white p-6 flex flex-col justify-between hover:border-[#6366F1]/25 hover:shadow-md transition-all duration-300">
      {/* Top: quote icon + stars */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <Quote className="w-7 h-7 text-[#6366F1]/15" />
          <Stars count={testimonial.stars} />
        </div>

        <blockquote className="text-sm text-zinc-600 leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
      </div>

      {/* Bottom: author */}
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[#E4E4E7]">
        <div className="w-9 h-9 rounded-full bg-[#6366F1] flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold tracking-tight">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#09090B] truncate">
            {testimonial.name}
          </div>
          <div className="text-xs text-zinc-400 truncate">
            {testimonial.role}, {testimonial.salon} — {testimonial.city}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: Testimonial[];
  direction: 'left' | 'right';
}) {
  // Duplicate items to create seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-[#FAFAFA] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-[#FAFAFA] to-transparent" />

      <div
        className={`gap-4 ${
          direction === 'left' ? 'marquee-row-left' : 'marquee-row-right'
        }`}
      >
        {doubled.map((t, i) => (
          <div key={`${t.id}-${i}`} className="px-2">
            <TestimonialCard testimonial={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-[#FAFAFA] overflow-hidden">
      {/* Header — contained */}
      <motion.div
        className="max-w-6xl mx-auto px-4 mb-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.div className="max-w-2xl" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E4E4E7] bg-white text-xs text-zinc-500 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
            Testimonianze
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#09090B] leading-tight mb-4">
            Chi lo usa,{' '}
            <span className="text-[#6366F1]">non torna indietro.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Saloni e barbieri in tutta Italia hanno già scelto Lume per
            semplificare il loro lavoro quotidiano.
          </p>
        </motion.div>
      </motion.div>

      {/* Marquee rows — full-bleed */}
      <div className="flex flex-col gap-4">
        <MarqueeRow items={row1} direction="left" />
        <MarqueeRow items={row2} direction="right" />
      </div>

      {/* Bottom social proof — contained */}
      <motion.div
        className="max-w-6xl mx-auto px-4 mt-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['FM', 'MF', 'GE', 'AB', 'EC'].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-[#6366F1] border-2 border-[#FAFAFA] flex items-center justify-center"
                >
                  <span className="text-white text-[9px] font-bold">
                    {initials}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-sm text-zinc-500 ml-1">
              +120 saloni attivi
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Stars count={5} />
            <span className="text-sm font-medium text-[#09090B]">4.9/5</span>
            <span className="text-sm text-zinc-400">media recensioni</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
