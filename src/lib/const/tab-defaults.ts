import type { TabsPageKey } from '@/lib/types/Preferences';

/**
 * Factory tab order + labels per page. Drives both the Settings reorder UI
 * (where labels and icons come from) and the page rendering (which reads the
 * order via `useOrderedTabs`).
 *
 * The first tab in this array is the factory landing tab.
 */
export const TAB_DEFAULTS: Record<TabsPageKey, readonly string[]> = {
  magazzino: ['prodotti', 'categorie', 'fornitori', 'marchi'],
  servizi: ['servizi', 'categorie'],
  coupons: ['gift', 'gift_card'],
  bilancio: ['panoramica', 'spese', 'obiettivi'],
  fiches: ['prenotate', 'arretrate', 'concluse', 'tutte'],
} as const;

export const TAB_LABELS: Record<TabsPageKey, Record<string, string>> = {
  magazzino: {
    prodotti: 'Prodotti',
    categorie: 'Categorie',
    fornitori: 'Fornitori',
    marchi: 'Marchi',
  },
  servizi: {
    servizi: 'Servizi',
    categorie: 'Categorie',
  },
  coupons: {
    gift: 'Coupon regalo',
    gift_card: 'Gift card',
  },
  bilancio: {
    panoramica: 'Panoramica',
    spese: 'Spese',
    obiettivi: 'Obiettivi',
  },
  fiches: {
    prenotate: 'Prenotate',
    arretrate: 'Arretrate',
    concluse: 'Concluse',
    tutte: 'Tutte',
  },
};

export const TAB_PAGE_LABELS: Record<TabsPageKey, string> = {
  magazzino: 'Magazzino',
  servizi: 'Servizi',
  coupons: 'Coupon e gift card',
  bilancio: 'Bilancio',
  fiches: 'Fiches',
};
