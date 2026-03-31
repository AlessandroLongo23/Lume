'use client';

import { Scissors, Palette, Sparkles, Droplets, Wind, Zap, RefreshCw, Leaf, type LucideIcon } from 'lucide-react';

const services: { title: string; Icon: LucideIcon }[] = [
  { title: 'Taglio', Icon: Scissors },
  { title: 'Colorazione', Icon: Palette },
  { title: 'Meches & Balayage', Icon: Sparkles },
  { title: 'Trattamenti', Icon: Droplets },
  { title: 'Piega & Styling', Icon: Wind },
  { title: 'Keratina', Icon: Zap },
  { title: 'Permanente', Icon: RefreshCw },
  { title: 'Maschera Nutritiva', Icon: Leaf },
];

export function SubjectsSection() {
  return (
    <section
      id="servizi"
      className="section-enter relative overflow-hidden scroll-mt-24"
      style={{ background: 'linear-gradient(160deg, var(--salon-ivory) 0%, var(--salon-cream) 100%)', padding: 'clamp(5rem, 10vw, 8rem) 1.5rem' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex items-start justify-between mb-16 lg:mb-20">
          <div className="fade-up">
            <p className="salon-label mb-4" style={{ color: 'var(--salon-dark)', opacity: 0.5 }}>03 / I Nostri Servizi</p>
            <h2 className="display-serif font-light leading-[0.9]" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', color: 'var(--salon-dark)' }}>
              Cosa<br />Facciamo
            </h2>
            <div className="gold-line mt-6 w-10" />
          </div>
          <div className="section-number hidden lg:block fade-in select-none" style={{ transitionDelay: '0.3s', WebkitTextStrokeColor: 'rgba(24,18,14,0.05)' }} aria-hidden="true">03</div>
        </div>

        <p className="text-base lg:text-lg font-light mb-16 max-w-2xl fade-up" style={{ color: 'var(--salon-text-muted-on-light)', lineHeight: 1.8, transitionDelay: '0.1s' }}>
          Dalla cura quotidiana ai trattamenti specializzati — ogni servizio è pensato per valorizzare la tua bellezza naturale.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0" style={{ borderTop: '1px solid rgba(24,18,14,0.1)' }}>
          {services.map(({ title, Icon }, i) => (
            <div
              key={i}
              className="group fade-up"
              style={{
                transitionDelay: `${0.08 + (i % 4) * 0.06}s`,
                padding: '2rem 1.5rem',
                borderBottom: '1px solid rgba(24,18,14,0.1)',
                borderRight: '1px solid rgba(24,18,14,0.1)',
                cursor: 'default',
              }}
            >
              <Icon className="w-4 h-4 mb-5 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--salon-gold)', opacity: 0.8 }} />
              <p className="font-light transition-colors duration-300" style={{ fontSize: '0.9rem', letterSpacing: '0.02em', color: 'var(--salon-dark)' }}>{title}</p>
              <div className="mt-4 h-px reveal-line" style={{ background: 'var(--salon-gold)', maxWidth: '2rem' }} />
            </div>
          ))}
        </div>

        <p className="text-center mt-12 fade-up display-serif italic" style={{ fontSize: '1.3rem', color: 'var(--salon-text-muted-on-light)', transitionDelay: '0.6s' }}>
          E molto altro ancora...
        </p>
      </div>
    </section>
  );
}
