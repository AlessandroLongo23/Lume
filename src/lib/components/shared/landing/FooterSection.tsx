'use client';

interface FooterSectionProps {
  onContactClick: () => void;
}

export function FooterSection({ onContactClick }: FooterSectionProps) {
  return (
    <footer
      style={{
        backgroundColor: 'var(--salon-dark)',
        borderTop: '1px solid var(--salon-dark-border)',
        padding: 'clamp(5rem, 10vw, 7rem) 1.5rem 3rem',
      }}
      className="relative overflow-hidden"
    >
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        {/* CTA */}
        <div
          className="grid lg:grid-cols-[2fr_1fr] gap-12 items-end pb-20"
          style={{ borderBottom: '1px solid var(--salon-dark-border)' }}
        >
          <div>
            <p className="salon-label mb-6">Prenota il Tuo Appuntamento</p>
            <h2
              className="display-serif font-light leading-[0.9]"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--salon-cream)' }}
            >
              Vieni a<br />Trovarci
            </h2>
            <div className="gold-line mt-6 mb-8 w-10" />
            <p
              className="text-base font-light max-w-lg"
              style={{ color: 'var(--salon-text-muted-on-dark)', lineHeight: 1.8 }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Prenota il tuo appuntamento e lasciati coccolare dai nostri professionisti.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <button onClick={onContactClick} className="btn-luxury-primary w-full lg:w-auto">
              Prenota Appuntamento
            </button>
            <a href="mailto:info@sinergiabellezza.it" className="btn-luxury-outline w-full lg:w-auto text-center">
              Scrivici una mail
            </a>
          </div>
        </div>

        {/* Contact info */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-16"
          style={{ borderBottom: '1px solid var(--salon-dark-border)' }}
        >
          <div>
            <p className="salon-label mb-3">Telefono</p>
            <a
              href="tel:+390000000000"
              className="text-sm font-light transition-colors duration-300"
              style={{ color: 'var(--salon-cream)', opacity: 0.7 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--salon-gold)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--salon-cream)')}
            >
              +39 000 000 0000
            </a>
          </div>
          <div>
            <p className="salon-label mb-3">Email</p>
            <a
              href="mailto:info@sinergiabellezza.it"
              className="text-sm font-light transition-colors duration-300"
              style={{ color: 'var(--salon-cream)', opacity: 0.7 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--salon-gold)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--salon-cream)')}
            >
              info@sinergiabellezza.it
            </a>
          </div>
          <div>
            <p className="salon-label mb-3">Indirizzo</p>
            <p className="text-sm font-light" style={{ color: 'var(--salon-cream)', opacity: 0.7 }}>
              Via Placeholder, 1<br />Città
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10">
          <p className="salon-label" style={{ opacity: 0.35 }}>
            © 2024 Lume — Tutti i diritti riservati
          </p>
          <p className="display-serif italic" style={{ fontSize: '0.9rem', color: 'var(--salon-gold)', opacity: 0.5 }}>
            Dove la cura incontra la bellezza
          </p>
        </div>
      </div>
    </footer>
  );
}
