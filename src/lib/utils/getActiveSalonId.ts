import { cookies } from 'next/headers';

/**
 * Reads the active salon ID from the httpOnly session cookie, falling back to
 * the profile's salon_id for users with a single salon (or existing sessions
 * that pre-date the gateway).
 *
 * Use this in every admin API route that scopes queries by salon:
 *
 *   const salonId = await getActiveSalonId(profile.salon_id);
 */
export async function getActiveSalonId(fallback: string): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('lume-active-salon-id')?.value ?? fallback;
}
