'use client';

import { Star, Quote } from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import type { Review } from '@/lib/types/Review';

interface TestimonialCardProps {
  review: Review;
  client?: Client | null;
}

export function TestimonialCard({ review, client }: TestimonialCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <div className="group luxury-testimonial-card transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full transition-all duration-700" style={{ background: 'linear-gradient(90deg, var(--salon-gold), transparent)' }} />

      <div className="flex items-center gap-1 mb-6">
        {stars.map((filled, i) => (
          <Star key={i} className="w-3.5 h-3.5" style={{ color: filled ? 'var(--salon-gold)' : 'rgba(196,149,58,0.2)', fill: filled ? 'var(--salon-gold)' : 'transparent' }} />
        ))}
      </div>

      <blockquote className="relative mb-8">
        <Quote className="absolute -top-1 -left-1 w-8 h-8 pointer-events-none" style={{ color: 'var(--salon-gold)', opacity: 0.1 }} />
        <p className="display-serif italic font-light leading-relaxed relative" style={{ fontSize: '1.05rem', color: 'var(--salon-cream)', lineHeight: 1.7 }}>
          {review.description}
        </p>
      </blockquote>

      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--salon-gold-muted)', border: '1px solid rgba(196,149,58,0.2)' }}>
          <span className="display-serif italic" style={{ fontSize: '1rem', color: 'var(--salon-gold)' }}>
            {client?.firstName?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <p className="font-light" style={{ fontSize: '0.78rem', letterSpacing: '0.06em', color: 'var(--salon-cream)', opacity: 0.8 }}>
            {client?.firstName ?? ''} {client?.lastName?.charAt(0)?.toUpperCase() ?? ''}.
          </p>
        </div>
      </div>
    </div>
  );
}
