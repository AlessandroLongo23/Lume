'use client';

import { Scissors, Award } from 'lucide-react';
import { ImageSlideshow } from './ImageSlideshow';

const salonImages = ['/placeholder.jpg', '/placeholder.jpg'];
const teamImages = ['/placeholder.jpg', '/placeholder.jpg'];

export function AboutSection() {
  return (
    <section
      id="about"
      className="section-enter relative overflow-hidden scroll-mt-24"
      style={{ background: 'linear-gradient(160deg, var(--salon-ivory) 0%, var(--salon-cream) 100%)', padding: 'clamp(5rem, 10vw, 8rem) 1.5rem' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex items-start justify-between mb-16 lg:mb-20">
          <div className="fade-up">
            <p className="salon-label mb-4" style={{ color: 'var(--salon-dark)', opacity: 0.5 }}>01 / Il Nostro Salone</p>
            <h2 className="display-serif font-light leading-[0.9]" style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', color: 'var(--salon-dark)' }}>
              Chi<br />Siamo
            </h2>
            <div className="gold-line mt-6 w-10" />
          </div>
          <div className="section-number hidden lg:block select-none fade-in" style={{ transitionDelay: '0.3s', WebkitTextStrokeColor: 'rgba(24,18,14,0.06)' }} aria-hidden="true">01</div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="space-y-8">
            <div className="slide-left" style={{ transitionDelay: '0.15s' }}>
              <p className="text-lg lg:text-xl leading-relaxed font-light" style={{ color: 'var(--salon-dark)', lineHeight: 1.8 }}>
                Siamo <strong style={{ fontWeight: 600, color: 'var(--salon-dark)' }}>un team di professionisti della bellezza</strong> con oltre{' '}
                <em className="display-serif italic" style={{ color: 'var(--salon-gold)', fontSize: '1.15em' }}>quindici anni</em>{' '}
                di esperienza nel settore, specializzati in taglio, colorazione e trattamenti capelli.
              </p>
            </div>
            <div className="slide-left" style={{ transitionDelay: '0.28s' }}>
              <p className="text-base leading-relaxed font-light" style={{ color: 'var(--salon-text-muted-on-light)', lineHeight: 1.9 }}>
                La nostra passione per la bellezza nasce dalla convinzione che ogni persona meriti di sentirsi al meglio ogni giorno.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 slide-left" style={{ transitionDelay: '0.48s' }}>
              {[
                { Icon: Scissors, label: 'Salone Certificato' },
                { Icon: Award, label: 'Prodotti Premium' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3" style={{ border: '1px solid rgba(196,149,58,0.2)', background: 'rgba(196,149,58,0.04)' }}>
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--salon-gold)' }} />
                  <span className="salon-label" style={{ color: 'var(--salon-dark)', opacity: 0.7 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block slide-right" style={{ transitionDelay: '0.22s' }}>
            <div className="relative w-[85%] h-[420px] ml-auto" style={{ border: '1px solid rgba(24,18,14,0.1)' }}>
              <ImageSlideshow images={salonImages} alt="Il nostro salone" duration={4000} />
              <span className="absolute top-0 right-0 w-6 h-6 pointer-events-none" style={{ borderTop: '1px solid var(--salon-gold)', borderRight: '1px solid var(--salon-gold)' }} />
              <span className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none" style={{ borderBottom: '1px solid var(--salon-gold)', borderLeft: '1px solid var(--salon-gold)' }} />
            </div>
            <div className="absolute -bottom-12 left-0 w-[55%] h-[260px]" style={{ border: '1px solid rgba(24,18,14,0.1)', background: 'var(--salon-cream)' }}>
              <ImageSlideshow images={teamImages} alt="Il nostro team" duration={6000} offset={3000} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
