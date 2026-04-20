/**
 * Returns a new object containing only the keys from `source` that appear in
 * `allowed`. Unknown keys are dropped. Used by API route handlers to make sure
 * request-body spreads can't set columns the caller isn't supposed to touch
 * (e.g. `salon_id`, `created_at`, `archived_at`, `is_super_admin`).
 *
 *   const safe = pickAllowed(body, ['name', 'price'] as const);
 *   await db.from('services').insert({ ...safe, salon_id });
 */
export function pickAllowed<T extends object, K extends keyof T & string>(
  source: T | null | undefined,
  allowed: readonly K[],
): Partial<Pick<T, K>> {
  if (!source || typeof source !== 'object') return {};
  const out: Partial<Pick<T, K>> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = (source as T)[key];
    }
  }
  return out;
}
