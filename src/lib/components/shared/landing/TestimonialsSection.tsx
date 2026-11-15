'use client';

import { useEffect, useState } from 'react';
import { motion, sectionVariants, itemVariants, viewportConfig } from './motion';
import type { ReviewWithAuthor } from '@/lib/types/Review';
import type { Testimonial } from '@/lib/const/testimonials';

/* Only real reviews from salons using Lume (/api/reviews). With none, the
   section is not rendered: no placeholder quotes, no invented counts. */

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

const HTML_DETECTOR = /^\s*<[a-z!]/i;

// Reviews stored pre-rich-text are plain strings; new ones are HTML already
// sanitized by /api/reviews. We trust the server's sanitation on read and
// render directly to avoid pulling sanitize-html into the landing bundle.
const QUOTE_RICH_CLASSES =
  'text-[length:var(--lp-text-body)] text-[var(--lume-text)] leading-relaxed break-words ' +
  '[&_p]:m-0 [&_p+p]:mt-2 ' +
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:my-1 [&_ol]:my-1 ' +
  '[&_li]:mt-0.5 ' +
  '[&_strong]:font-medium [&_em]:italic [&_s]:line-through ' +
  '[&_blockquote]:border-l [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-[var(--lume-text-secondary)] [&_blockquote]:my-1 ' +
  '[&_a]:text-[var(--lume-accent)] [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_code]:bg-hover [&_code]:px-1 [&_code]:rounded';

function TestimonialQuote({ content }: { content: string }) {
  if (HTML_DETECTOR.test(content)) {
    return (
      <blockquote className={QUOTE_RICH_CLASSES} dangerouslySetInnerHTML={{ __html: content }} />
    );
  }
  return (
    <blockquote className="text-[length:var(--lp-text-body)] text-[var(--lume-text)] leading-relaxed break-words whitespace-pre-line">
      {content}
    </blockquote>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const authorLine = [testimonial.role, testimonial.salon, testimonial.city]
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .join(', ');

  return (
    <figure className="flex flex-col justify-between gap-6 p-6 md:p-7">
      <TestimonialQuote content={testimonial.quote} />
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[var(--lume-text)]">{testimonial.name}</span>
        <span className="text-compact text-[var(--lume-text-secondary)]">{authorLine}</span>
        <span className="tabular-nums text-2xs text-[var(--lume-text-muted)] mt-1">
          {testimonial.stars} su 5
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Testimonial[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.reviews)) {
          setReviews((data.reviews as ReviewWithAuthor[]).map(reviewToTestimonial));
        }
      })
      .catch(() => {
        // Silent: without reviews the section stays hidden.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="lp-section">
      <motion.div
        className="lp-container"
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        variants={sectionVariants}
      >
        <motion.div className="lp-split" variants={itemVariants}>
          <h2 className="lp-h2">Chi lo usa ogni giorno</h2>
          <p className="lp-lede">Le parole di titolari e operatori che lavorano con Lume.</p>
        </motion.div>
        <motion.div className="lp-cols" variants={itemVariants}>
          {reviews.slice(0, 6).map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
