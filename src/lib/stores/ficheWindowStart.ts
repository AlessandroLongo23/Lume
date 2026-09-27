/**
 * The app opens with the last 90 days of fiches (plus everything booked ahead) so first
 * load stays fast on salons with years of history. Older periods load on demand through
 * the stores' ensureLoadedFrom (see stores/ficheWindow.ts).
 *
 * Kept in a module with no imports: fiches.ts and fiche_services.ts import each other
 * indirectly (through types/Fiche.ts), so a shared constant living in either one is read
 * before it is initialised.
 */
export const INITIAL_WINDOW_DAYS = 90;

export function initialLoadedFrom(): Date {
  const d = new Date();
  d.setDate(d.getDate() - INITIAL_WINDOW_DAYS);
  d.setHours(0, 0, 0, 0);
  return d;
}
