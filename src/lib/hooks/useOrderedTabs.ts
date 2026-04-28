'use client';

import { useMemo } from 'react';
import { usePreferencesStore } from '@/lib/stores/preferences';
import type { TabsPageKey } from '@/lib/types/Preferences';

/**
 * Resolves the tab order + visibility for a tabbed page based on user
 * preferences and the page's factory default order.
 *
 *   const { order, hidden, visible } = useOrderedTabs('magazzino', ['prodotti','categorie',…]);
 *
 * - `order` is the merged order: preferred IDs first (filtered to known
 *   tabs), then any factory tabs not yet listed in the preference. This
 *   ensures new tabs added to the codebase appear without forcing every
 *   user to reset their preference.
 * - `hidden` is the set of tab IDs the user chose to hide.
 * - `visible` is `order` filtered by `hidden`.
 */
export function useOrderedTabs<T extends string>(
  page: TabsPageKey,
  defaultOrder: readonly T[],
): { order: T[]; hidden: Set<T>; visible: T[] } {
  const tabsPref = usePreferencesStore((s) => s.preferences.tabs);

  return useMemo(() => {
    const pref = tabsPref?.[page];
    const known = new Set<T>(defaultOrder);

    let order: T[];
    if (pref?.order && pref.order.length > 0) {
      const seen = new Set<T>();
      const ordered: T[] = [];
      for (const id of pref.order) {
        if (known.has(id as T) && !seen.has(id as T)) {
          ordered.push(id as T);
          seen.add(id as T);
        }
      }
      for (const id of defaultOrder) {
        if (!seen.has(id)) ordered.push(id);
      }
      order = ordered;
    } else {
      order = [...defaultOrder];
    }

    const hidden = new Set<T>(
      (pref?.hidden ?? []).filter((h): h is T => known.has(h as T)),
    );
    // Never let the user hide every tab — fall back to factory order.
    const visible = order.filter((id) => !hidden.has(id));
    return { order, hidden, visible: visible.length > 0 ? visible : [...defaultOrder] };
  }, [tabsPref, page, defaultOrder]);
}
