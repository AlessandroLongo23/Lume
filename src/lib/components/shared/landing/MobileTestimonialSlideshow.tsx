'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialCard } from '@/lib/components/cards/TestimonialCard';
import { useClientsStore } from '@/lib/stores/clients';
import type { Review } from '@/lib/types/Review';

interface MobileTestimonialSlideshowProps {
  reviews: Review[];
  className?: string;
}

export function MobileTestimonialSlideshow({ reviews, className = '' }: MobileTestimonialSlideshowProps) {
  const clients = useClientsStore((s) => s.clients);
  const [currentIndex, setCurrentIndex] = useState(0);
  const numItems = reviews.length;

  const next = () => {
    if (!numItems) return;
    setCurrentIndex((i) => (i + 1) % numItems);
  };

  const prev = () => {
    if (!numItems) return;
    setCurrentIndex((i) => (i - 1 + numItems) % numItems);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {reviews.map((testimonial) => {
            const client = clients.find((c) => c.id === testimonial.client_id) ?? null;
            return (
              <div key={testimonial.id} className="w-full flex-shrink-0 px-1">
                <TestimonialCard review={testimonial} client={client} />
              </div>
            );
          })}
        </div>
      </div>

      {numItems > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={prev}
            className="rounded-full p-2 shadow-sm transition focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--salon-dark-border)' }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: 'var(--salon-cream)' }} />
          </button>

          <div className="flex justify-center space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="h-2 w-2 rounded-full transition-colors duration-300"
                style={{
                  background: index === currentIndex ? 'var(--salon-gold)' : 'rgba(196,149,58,0.25)',
                  transform: index === currentIndex ? 'scale(1.25)' : undefined,
                }}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="rounded-full p-2 shadow-sm transition focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--salon-dark-border)' }}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" style={{ color: 'var(--salon-cream)' }} />
          </button>
        </div>
      )}
    </div>
  );
}
