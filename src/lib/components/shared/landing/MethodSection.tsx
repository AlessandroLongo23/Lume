'use client';

import Image from 'next/image';
import { philosophyCards } from '@/lib/const/salonData';

export function MethodSection() {
  return (
    <section
      id="filosofia"
      className="section-enter relative overflow-hidden scroll-mt-24"
      style={{ backgroundColor: 'var(--salon-dark)', padding: 'clamp(5rem, 10vw, 8rem) 1.5rem' }}
    >
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex items-center justify-between mb-20">
          <p className="salon-label fade-up">02 / La Nostra Filosofia</p>
          <div className="section-number hidden lg:block fade-in" style={{ transitionDelay: '0.2s', fontSize: 'clamp(5rem, 12vw, 10rem)' }} aria-hidden="true">02</div>
        </div>

        <div className="text-center mb-24 fade-up" style={{ transitionDelay: '0.1s' }}>
          <blockquote className="display-serif italic font-light mx-auto" style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)', color: 'var(--salon-cream)', lineHeight: 1.25, maxWidth: '820px' }}>
            &ldquo;Bellezza autentica, cura artigianale<br className="hidden sm:block" />
            e rispetto per ogni cliente.&rdquo;
          </blockquote>
          <div className="gold-line-centered mt-8 mx-auto" style={{ maxWidth: '120px' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          {philosophyCards.map((card, i) => (
            <div
              key={i}
              className="fade-up"
              style={{
                transitionDelay: `${0.15 + i * 0.12}s`,
                padding: '2.5rem',
                borderTop: '1px solid var(--salon-gold)',
                borderRight: i < philosophyCards.length - 1 ? '1px solid var(--salon-dark-border)' : undefined,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full mb-8" style={{ background: 'var(--salon-gold)', opacity: 0.8 }} />
              <h3 className="display-serif font-light mb-5" style={{ fontSize: '1.6rem', color: 'var(--salon-cream)' }}>{card.title}</h3>
              <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--salon-text-muted-on-dark)', lineHeight: 1.85 }}>{card.description}</p>
            </div>
          ))}
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-16 items-center mt-24 pt-16 fade-up" style={{ borderTop: '1px solid var(--salon-dark-border)', transitionDelay: '0.5s' }}>
          <div>
            <p className="text-base leading-relaxed font-light" style={{ color: 'var(--salon-text-muted-on-dark)', lineHeight: 1.9 }}>
              Crediamo che la vera bellezza nasca dall&apos;ascolto, dalla cura dei dettagli e dalla scelta consapevole dei prodotti giusti.
            </p>
          </div>
          <div className="relative">
            <div className="w-full h-[260px] overflow-hidden" style={{ border: '1px solid var(--salon-dark-border)' }}>
              <Image src="/placeholder.jpg" alt="Il nostro approccio" fill className="object-cover opacity-60"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <span className="absolute top-0 right-0 w-6 h-6 pointer-events-none" style={{ borderTop: '1px solid var(--salon-gold)', borderRight: '1px solid var(--salon-gold)' }} />
            <span className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none" style={{ borderBottom: '1px solid var(--salon-gold)', borderLeft: '1px solid var(--salon-gold)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
