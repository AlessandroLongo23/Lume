/**
 * Live prerequisite predicates for tutorials. Each reads the relevant Zustand
 * store's hydrated state (all stores are populated under the admin layout by
 * `StoreInitializer`, so these are valid anywhere inside `/admin`).
 *
 * These touch client stores, so this module — and any registry entry that
 * references it via `Tutorial.prerequisites` — must NEVER be imported from a
 * server component.
 */
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useProductsStore } from '@/lib/stores/products';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useFichesStore } from '@/lib/stores/fiches';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { FicheStatus } from '@/lib/types/ficheStatus';

export const hasClients = (): boolean => useClientsStore.getState().clients.length > 0;
export const hasServices = (): boolean => useServicesStore.getState().services.length > 0;
export const hasOperators = (): boolean => useOperatorsStore.getState().operators.length > 0;
export const hasProducts = (): boolean => useProductsStore.getState().products.length > 0;
export const hasCoupons = (): boolean => useCouponsStore.getState().coupons.length > 0;
export const hasFiches = (): boolean => useFichesStore.getState().fiches.length > 0;
/** True when the salon has at least one fiche that is NOT yet closed/paid —
 * the only kind that can be incassata. A salon full of CONCLUSA fiches has no
 * working surface for the incassa-fiche tour, so it chains crea-fiche first. */
export const hasOpenFiches = (): boolean =>
  useFichesStore.getState().fiches.some((f) => f.status !== FicheStatus.COMPLETED);
export const hasAbbonamenti = (): boolean => useAbbonamentiStore.getState().abbonamenti.length > 0;
