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

export const hasClients = (): boolean => useClientsStore.getState().clients.length > 0;
export const hasServices = (): boolean => useServicesStore.getState().services.length > 0;
export const hasOperators = (): boolean => useOperatorsStore.getState().operators.length > 0;
export const hasProducts = (): boolean => useProductsStore.getState().products.length > 0;
export const hasCoupons = (): boolean => useCouponsStore.getState().coupons.length > 0;
export const hasFiches = (): boolean => useFichesStore.getState().fiches.length > 0;
export const hasAbbonamenti = (): boolean => useAbbonamentiStore.getState().abbonamenti.length > 0;
