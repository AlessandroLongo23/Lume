import { cookies } from 'next/headers';

/**
 * Reads the active salon ID from the httpOnly session cookie, falling back to
 * the profile's salon_id for users with a single salon (or existing sessions
 * that pre-date the gateway).
 *
 * For super-admins the cookie is only trusted when paired with the
 * non-httpOnly `lume-impersonating=1` flag (both set by
 * `/api/platform/enter-salon`). This prevents a stale `lume-active-salon-id`
 * from a prior impersonation from leaking through after the flag cookie is
 * cleared (e.g. browser cookie purge, third-party cookie blockers, logout).
 *
 *   const salonId = await getActiveSalonId(profile.salon_id, profile.is_super_admin);
 */
export async function getActiveSalonId(
  fallback: string,
  isSuperAdmin: boolean = false,
): Promise<string> {
  const cookieStore = await cookies();
  const activeSalonId = cookieStore.get('lume-active-salon-id')?.value;

  if (isSuperAdmin) {
    const impersonating = cookieStore.get('lume-impersonating')?.value === '1';
    if (activeSalonId && impersonating) return activeSalonId;
    return fallback;
  }

  return activeSalonId ?? fallback;
}
