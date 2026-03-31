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
    <div className="group feature-card transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500 bg-linear-to-r from-[#6366F1] to-transparent" />

      <div className="flex items-center gap-1 mb-5">
        {stars.map((filled, i) => (
          <Star
            key={i}
            className="w-3.5 h-3.5"
            style={{
              color: filled ? '#6366F1' : '#E4E4E7',
              fill: filled ? '#6366F1' : 'transparent',
            }}
          />
        ))}
      </div>

      <blockquote className="relative mb-6">
        <Quote className="absolute -top-1 -left-1 w-7 h-7 pointer-events-none text-[#6366F1] opacity-10" />
        <p className="italic font-light leading-relaxed relative text-[#09090B] dark:text-[#FAFAFA]" style={{ fontSize: '0.975rem', lineHeight: 1.7 }}>
          {review.description}
        </p>
      </blockquote>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#EEF2FF] dark:bg-[#1E1B4B]/40 border border-[#E4E4E7] dark:border-[#27272A]">
          <span className="text-sm font-medium text-[#6366F1]">
            {client?.firstName?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <p className="text-sm text-[#52525B] dark:text-[#A1A1AA]">
          {client?.firstName ?? ''} {client?.lastName?.charAt(0)?.toUpperCase() ?? ''}.
        </p>
      </div>
    </div>
  );
}
