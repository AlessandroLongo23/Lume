import { CATEGORY_PICKER_COLORS } from '@/lib/const/category-colors';

/** djb2 over the id string — deterministic, well-distributed, no deps. */
function hashClientId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Returns a stable color for a client. If `color` is set it's used as-is
 * (explicit override); otherwise we hash the id against the shared 12-swatch
 * palette so the same client always lands on the same color across sessions.
 */
export function colorForClient(client: { id: string; color?: string | null }): string {
  if (client.color) return client.color;
  return CATEGORY_PICKER_COLORS[hashClientId(client.id) % CATEGORY_PICKER_COLORS.length];
}
