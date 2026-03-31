'use client';

import Image from 'next/image';
import { Phone, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onContactClick: () => void;
}

const stats = [
  { value: '500+', label: 'Clienti Fidelizzati' },
  { value: '15+', label: 'Anni di Esperienza' },
  { value: '100%', label: 'Prodotti Selezionati' },
];

export function HeroSection({ onContactClick }: HeroSectionProps) {
  return (
    <section
      className="section-enter visible relative min-h-screen flex flex-col justify-between luxury-dark overflow-hidden"
      style={{ paddingTop: '5rem' }}
    >
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center py-12 lg:py-20">
            <div>
              <p className="salon-label mb-10 fade-up">Il Salone · Dal 2009</p>
              <h1 className="display-serif leading-[0.88] fade-up" style={{ transitionDelay: '0.1s' }}>
                <span className="block font-light text-[clamp(3rem,8vw,7.5rem)]" style={{ color: 'var(--salon-cream)' }}>Sinergia</span>
                <span className="block font-light italic text-[clamp(3rem,8vw,7.5rem)]" style={{ color: 'var(--salon-gold)' }}>della</span>
                <span className="block font-light text-[clamp(3rem,8vw,7.5rem)]" style={{ color: 'var(--salon-cream)' }}>Bellezza</span>
              </h1>
              <div className="gold-line mt-8 mb-8 w-12 fade-up" style={{ transitionDelay: '0.25s' }} />
              <p className="text-base lg:text-lg leading-relaxed max-w-lg font-light fade-up" style={{ color: 'var(--salon-text-muted-on-dark)', transitionDelay: '0.32s' }}>
                Un&apos;esperienza di bellezza unica dove la cura artigianale e i prodotti di qualità si incontrano per valorizzare la tua bellezza naturale.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-10 fade-up" style={{ transitionDelay: '0.42s' }}>
                <button onClick={onContactClick} className="btn-luxury-primary">Prenota ora</button>
                <a href="mailto:info@sinergiabellezza.it" className="btn-luxury-outline">Scrivici</a>
                <a href="tel:+390000000000" className="btn-luxury-outline" aria-label="Chiamaci" style={{ padding: '0.85rem 1.1rem' }}>
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="hidden lg:flex justify-end items-center fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="luxury-image-frame relative w-[320px] h-[420px]">
                <Image
                  src="/placeholder.jpg"
                  alt="Sinergia della Bellezza"
                  fill
                  className="object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="absolute top-0 left-0 w-8 h-8 pointer-events-none" style={{ borderTop: '1px solid var(--salon-gold)', borderLeft: '1px solid var(--salon-gold)' }} />
                <span className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none" style={{ borderBottom: '1px solid var(--salon-gold)', borderRight: '1px solid var(--salon-gold)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 fade-up" style={{ borderTop: '1px solid var(--salon-dark-border)', transitionDelay: '0.55s' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex items-stretch py-8" style={{ borderColor: 'var(--salon-dark-border)' }}>
            {stats.map((stat, i) => (
              <div key={i} className="flex-1 text-center px-6 first:pl-0 last:pr-0" style={{ borderRight: i < stats.length - 1 ? '1px solid var(--salon-dark-border)' : undefined }}>
                <div className="display-serif font-light leading-none" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: 'var(--salon-gold)' }}>{stat.value}</div>
                <div className="salon-label mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <a href="#about" aria-label="Scopri di più" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-1.5 group">
        <span className="salon-label" style={{ opacity: 0.5 }}>Scopri</span>
        <ChevronDown className="w-4 h-4 animate-bounce" style={{ color: 'var(--salon-gold)', opacity: 0.6 }} />
      </a>
    </section>
  );
}
