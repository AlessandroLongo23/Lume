import { useEffect } from 'react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';

/**
 * Makes sure fiches and their service lines are loaded from `from` onwards.
 * The app opens with the last 90 days; screens that show older periods (calendar,
 * fiche list) call this so the period they display is actually in the stores.
 * Products and payments are loaded in full at startup, so they need nothing here.
 */
export function ensureFichesLoadedFrom(from: Date): Promise<void> {
  return Promise.all([
    useFichesStore.getState().ensureLoadedFrom(from),
    useFicheServicesStore.getState().ensureLoadedFrom(from),
  ]).then(() => undefined);
}

/** Hook form: loads from `from` whenever it moves earlier. Pass null to skip. */
export function useEnsureFichesLoadedFrom(from: Date | null): void {
  const time = from?.getTime() ?? null;
  useEffect(() => {
    if (time !== null) void ensureFichesLoadedFrom(new Date(time));
  }, [time]);
}
