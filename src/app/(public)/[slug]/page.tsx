import { notFound } from 'next/navigation';
import {
  loadBookableServices,
  loadPublicClosures,
  loadPublicSalon,
} from '@/lib/gateway/loadPublicSalon';
import { SalonHeader } from '@/lib/components/public/SalonHeader';
import { BookingFlow } from '@/lib/components/public/BookingFlow';

export default async function PublicSalonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const salon = await loadPublicSalon(slug);
  if (!salon) notFound();

  const [services, closures] = await Promise.all([
    loadBookableServices(salon.id),
    loadPublicClosures(salon.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <SalonHeader salon={salon} />
      <BookingFlow slug={slug} salon={salon} services={services} closures={closures} />
    </main>
  );
}
