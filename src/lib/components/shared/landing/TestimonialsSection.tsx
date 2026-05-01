'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { motion, itemVariants, viewportConfig } from './motion';
import type { ReviewWithAuthor } from '@/lib/types/Review';
import {
  staticTestimonialsRow1,
  staticTestimonialsRow2,
  type Testimonial,
} from '@/lib/const/testimonials';

function reviewToTestimonial(r: ReviewWithAuthor): Testimonial {
  const firstName = r.author_first_name?.trim() ?? '';
  const lastName = r.author_last_name?.trim() ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Utente Lume';
  return {
    id: r.id,
    name,
    role: r.author_role === 'owner' ? 'Titolare' : 'Operatore',
    salon: r.salon_name ?? '',
    city: null,
    quote: r.message,
    stars: r.rating,
  };
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

const HTML_DETECTOR = /^\s*<[a-z!]/i;

// Reviews stored pre-rich-text are plain strings; new ones are HTML already
// sanitized by /api/reviews. We trust the server's sanitation on read and
// render directly to avoid pulling sanitize-html into the landing bundle.
const QUOTE_RICH_CLASSES =
  'text-sm text-zinc-600 leading-relaxed break-words ' +
  '[&_p]:m-0 [&_p+p]:mt-2 ' +
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-1 [&_ol]:my-1 ' +
  '[&_li]:mt-0.5 ' +
  '[&_strong]:font-semibold [&_em]:italic [&_s]:line-through ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-200 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_blockquote]:my-1 ' +
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:rounded';

function TestimonialQuote({ content }: { content: string }) {
  if (HTML_DETECTOR.test(content)) {
    return (
      <blockquote
        className={QUOTE_RICH_CLASSES}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <blockquote className="text-sm text-zinc-600 leading-relaxed break-words whitespace-pre-line">
      {content}
    </blockquote>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  const authorLine = [testimonial.role, testimonial.salon, testimonial.city]
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .join(' — ');

  return (
    <div className="w-[340px] sm:w-[380px] shrink-0 rounded-2xl border border-border bg-white p-6 flex flex-col justify-between hover:border-primary/25 hover:shadow-md transition-all duration-300">
      {/* Top: quote icon + stars */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <Quote className="w-7 h-7 text-primary/20" />
          <Stars count={testimonial.stars} />
        </div>

        <TestimonialQuote content={testimonial.quote} />
      </div>

      {/* Bottom: author */}
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-2xs font-bold tracking-tight">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {testimonial.name}
          </div>
          <div className="text-xs text-zinc-400 truncate">{authorLine}</div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: Testimonial[];
  direction: 'left' | 'right';
}) {
  // Duplicate items to create seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-content-floating bg-linear-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-content-floating bg-linear-to-l from-background to-transparent" />

      <div
        className={`gap-4 ${
          direction === 'left' ? 'marquee-row-left' : 'marquee-row-right'
        }`}
      >
        {doubled.map((t, i) => (
          <div key={`${t.id}-${i}`} className="px-2">
            <TestimonialCard testimonial={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [dbReviews, setDbReviews] = useState<Testimonial[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.reviews)) {
          setDbReviews((data.reviews as ReviewWithAuthor[]).map(reviewToTestimonial));
        }
      })
      .catch(() => {
        // Silent — landing page falls back to static testimonials.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Interleave real reviews across both rows so they're visible, with static
  // mocks as backfill. The interleave is deterministic (no shuffle) so the
  // order is stable across renders.
  const { row1, row2 } = useMemo(() => {
    const realRow1: Testimonial[] = [];
    const realRow2: Testimonial[] = [];
    dbReviews.forEach((t, i) => {
      (i % 2 === 0 ? realRow1 : realRow2).push(t);
    });
    return {
      row1: [...realRow1, ...staticTestimonialsRow1],
      row2: [...realRow2, ...staticTestimonialsRow2],
    };
  }, [dbReviews]);

  return (
    <section className="py-24 bg-background overflow-hidden">
      {/* Header — contained */}
      <motion.div
        className="max-w-6xl mx-auto px-4 mb-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.div className="max-w-2xl" variants={itemVariants}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white text-xs text-zinc-500 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Testimonianze
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            Chi lo usa,{' '}
            <span className="text-primary">non torna indietro.</span>
          </h2>
          <p className="text-zinc-500 text-lg leading-relaxed">
            Saloni e barbieri in tutta Italia hanno già scelto Lume per
            semplificare il loro lavoro quotidiano.
          </p>
        </motion.div>
      </motion.div>

      {/* Marquee rows — full-bleed */}
      <div className="flex flex-col gap-4">
        <MarqueeRow items={row1} direction="left" />
        <MarqueeRow items={row2} direction="right" />
      </div>

      {/* Bottom social proof — contained */}
      <motion.div
        className="max-w-6xl mx-auto px-4 mt-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['FM', 'MF', 'GE', 'AB', 'EC'].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center"
                >
                  <span className="text-white text-2xs font-bold">
                    {initials}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-sm text-zinc-500 ml-1">
              +120 saloni attivi
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Stars count={5} />
            <span className="text-sm font-medium text-foreground">4.9/5</span>
            <span className="text-sm text-zinc-400">media recensioni</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
