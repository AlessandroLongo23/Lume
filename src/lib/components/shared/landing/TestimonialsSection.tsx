'use client';

import { useReviewsStore } from '@/lib/stores/reviews';
import { TestimonialCard } from '@/lib/components/cards/TestimonialCard';
import { useClientsStore } from '@/lib/stores/clients';

export function TestimonialsSection() {
  const reviews = useReviewsStore((s) => s.reviews);
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useReviewsStore((s) => s.isLoading);

  if (isLoading || reviews.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-[#FAFAFA] section-enter">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16 fade-up">
          <div className="accent-line mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-[#09090B] mb-4">
            Cosa dicono i nostri clienti.
          </h2>
          <p className="text-zinc-500 text-lg">
            Saloni reali. Risultati reali.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up">
          {reviews.map((review) => {
            const client = clients.find((c) => c.id === review.client_id) ?? null;
            return <TestimonialCard key={review.id} review={review} client={client} />;
          })}
        </div>
      </div>
    </section>
  );
}
