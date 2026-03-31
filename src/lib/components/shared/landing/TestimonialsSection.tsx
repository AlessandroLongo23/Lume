'use client';

import { useReviewsStore } from '@/lib/stores/reviews';
import { MobileTestimonialSlideshow } from './MobileTestimonialSlideshow';
import { ScrollingTestimonials } from './ScrollingTestimonials';

export function TestimonialsSection() {
  const reviews = useReviewsStore((s) => s.reviews);
  const isLoading = useReviewsStore((s) => s.isLoading);

  return (
    <section
      id="testimonials"
      className="section-enter relative overflow-hidden scroll-mt-24"
      style={{ backgroundColor: 'var(--salon-dark-surface)', padding: 'clamp(5rem, 10vw, 8rem) 1.5rem' }}
    >
      <div className="grain-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex items-start justify-between mb-16 lg:mb-20">
          <div className="fade-up">
            <p className="salon-label mb-4">04 / Testimonianze</p>
            <h2
              className="display-serif font-light leading-[0.9]"
              style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', color: 'var(--salon-cream)' }}
            >
              Cosa Dicono<br />i Nostri Clienti
            </h2>
            <div className="gold-line mt-6 w-10" />
          </div>
          <div
            className="section-number hidden lg:block fade-in select-none"
            style={{ transitionDelay: '0.2s', fontSize: 'clamp(5rem, 12vw, 10rem)' }}
            aria-hidden="true"
          >
            04
          </div>
        </div>

        {/* Mobile slideshow */}
        <div className="block lg:hidden fade-up" style={{ transitionDelay: '0.15s' }}>
          <MobileTestimonialSlideshow reviews={reviews} className="px-0" />
        </div>

        {/* Desktop carousel */}
        <div className="hidden lg:block fade-up" style={{ transitionDelay: '0.15s' }}>
          <ScrollingTestimonials reviews={reviews} />
        </div>

        {reviews.length === 0 && !isLoading && (
          <p
            className="text-center py-20 display-serif italic"
            style={{ fontSize: '1.4rem', color: 'var(--salon-text-muted-on-dark)' }}
          >
            Le prime recensioni arriveranno presto...
          </p>
        )}
      </div>
    </section>
  );
}
