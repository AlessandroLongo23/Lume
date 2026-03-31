'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialCard } from '@/lib/components/cards/TestimonialCard';
import { useClientsStore } from '@/lib/stores/clients';
import type { Review } from '@/lib/types/Review';

interface ScrollingTestimonialsProps {
  reviews: Review[];
  className?: string;
}

const ITEMS_PER_PAGE = 3;

export function ScrollingTestimonials({ reviews, className = '' }: ScrollingTestimonialsProps) {
  const clients = useClientsStore((s) => s.clients);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  const groups = Array.from({ length: Math.ceil(reviews.length / ITEMS_PER_PAGE) }, (_, i) =>
    reviews.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE)
  );
  const numGroups = groups.length;
  const displayGroups = numGroups > 1 ? [groups[numGroups - 1], ...groups, groups[0]] : groups;

  const showNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((i) => i + 1);
  };

  const showPrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((i) => i - 1);
  };

  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(numGroups);
    } else if (currentIndex === numGroups + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {displayGroups.map((group, gi) => (
            <div key={gi} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 items-start">
                {group.map((testimonial) => {
                  const client = clients.find((c) => c.id === testimonial.client_id) ?? null;
                  return <TestimonialCard key={testimonial.id} review={testimonial} client={client} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {numGroups > 1 && (
        <>
          <button
            onClick={showPrev}
            className="absolute -left-12 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 shadow-lg backdrop-blur-sm transition hover:scale-110 focus:outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--salon-dark-border)' }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: 'var(--salon-cream)' }} />
          </button>
          <button
            onClick={showNext}
            className="absolute -right-12 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 shadow-lg backdrop-blur-sm transition hover:scale-110 focus:outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--salon-dark-border)' }}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" style={{ color: 'var(--salon-cream)' }} />
          </button>
        </>
      )}
    </div>
  );
}
