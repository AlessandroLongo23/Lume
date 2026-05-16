import { notFound } from 'next/navigation';
import { loadBookingByToken } from '@/lib/gateway/loadPublicSalon';
import { BookingManagePage } from '@/lib/components/public/BookingManagePage';

// Public landing page reached from the magic link in the confirmation email.
// The URL is `<slug>/prenotazione/<token>` — slug is here only for branding
// consistency, the SECURITY DEFINER resolver keys exclusively off the token.
//
// If the slug param doesn't match the booking's salon (e.g. someone hand-
// edited the URL) we still render — the token is the source of truth and we
// don't want to leak whether the booking exists by 404'ing differently.
export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { token } = await params;
  // Sanity-bound the token shape — we mint 128-bit hex (32 chars) but accept
  // 16..64 hex so an env that picks a different size doesn't silently 404.
  if (!/^[0-9a-f]{16,64}$/i.test(token)) notFound();

  const booking = await loadBookingByToken(token);
  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <BookingManagePage booking={booking} />
    </main>
  );
}
