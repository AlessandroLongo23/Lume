'use client';

const items = [
  'Taglio', 'Colorazione', 'Meches & Balayage', 'Keratina',
  'Piega & Styling', 'Trattamenti', 'Permanente', 'Maschera Nutritiva',
];

const repeated = [...items, ...items];

export function MarqueeStrip() {
  return (
    <div
      className="marquee-wrapper py-4 overflow-hidden"
      style={{ backgroundColor: 'var(--salon-dark-surface)', borderTop: '1px solid var(--salon-dark-border)', borderBottom: '1px solid var(--salon-dark-border)' }}
      aria-hidden="true"
    >
      <div className="marquee-track">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 px-6">
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--salon-gold)', opacity: 0.7 }}>
              {item}
            </span>
            <span style={{ color: 'var(--salon-gold)', opacity: 0.25, fontSize: '0.5rem' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
