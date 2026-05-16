import Image from 'next/image';
import { loadPublicSalon } from '@/lib/gateway/loadPublicSalon';
import { notFound } from 'next/navigation';

// Stub for sub-project E (public booking — read path). Renders enough to
// visually verify that brand-color injection from `[slug]/layout.tsx` flows
// through to interactive surfaces.
export default async function PublicSalonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const salon = await loadPublicSalon(slug);
  if (!salon) notFound();

  const locationParts = [salon.address, salon.city, salon.province].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="flex items-center gap-4">
        {salon.logo_url && (
          <div className="size-16 rounded-xl overflow-hidden bg-[var(--lume-surface)] border border-[var(--lume-border)] flex items-center justify-center shrink-0">
            <Image
              src={salon.logo_url}
              alt={salon.name}
              width={64}
              height={64}
              className="size-full object-contain"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--lume-text)] truncate">
            {salon.name}
          </h1>
          {locationParts.length > 0 && (
            <p className="mt-1 text-sm text-[var(--lume-text-secondary)] truncate">
              {locationParts.join(', ')}
            </p>
          )}
        </div>
      </header>

      <section className="mt-12 rounded-2xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] p-8 text-center">
        <p className="text-sm text-[var(--lume-text-secondary)]">
          Prenotazione online in arrivo a breve.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--lume-button-accent-bg)] px-4 py-2 text-sm font-medium text-[var(--lume-button-accent-fg)] opacity-50 cursor-not-allowed"
        >
          Prenota un appuntamento
        </button>
      </section>
    </main>
  );
}
