export const APP_ROLES = ['admin', 'owner', 'operator', 'client'] as const;
export type AppRole = typeof APP_ROLES[number];

// Roles that are stored on the profiles.role column. 'client' is derived
// from the clients table (via clients.user_id), not from profiles.
export type ProfileRole = Exclude<AppRole, 'client'>;
export const PROFILE_ROLES: readonly ProfileRole[] = ['admin', 'owner', 'operator'];

export const isAdmin    = (r: string | null | undefined): r is 'admin'    => r === 'admin';
export const isOwner    = (r: string | null | undefined): r is 'owner'    => r === 'owner';
export const isOperator = (r: string | null | undefined): r is 'operator' => r === 'operator';
export const isClient   = (r: string | null | undefined): r is 'client'   => r === 'client';

// Can mutate salon config (delete clients, manage operators, change settings).
export const canManageSalon = (r: string | null | undefined): boolean =>
  r === 'admin' || r === 'owner';

// Staff roles (anyone working inside the salon dashboard).
export const isSalonStaff = (r: string | null | undefined): boolean =>
  r === 'admin' || r === 'owner' || r === 'operator';

/**
 * Narrows a raw `profiles.role` string to a ProfileRole, returning null for
 * unexpected or missing values. Use on every boundary between DB and app.
 */
export function normalizeProfileRole(
  row: { role?: string | null } | null | undefined,
): ProfileRole | null {
  if (!row) return null;
  if (row.role === 'admin' || row.role === 'owner' || row.role === 'operator') {
    return row.role;
  }
  return null;
}
