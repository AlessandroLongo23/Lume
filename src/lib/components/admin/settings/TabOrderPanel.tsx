'use client';

import { useMemo } from 'react';
import { Reorder } from 'motion/react';
import { LayoutList, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { TAB_DEFAULTS, TAB_LABELS, TAB_PAGE_LABELS } from '@/lib/const/tab-defaults';
import type { TabsPageKey } from '@/lib/types/Preferences';

const PAGE_KEYS: TabsPageKey[] = ['magazzino', 'servizi', 'coupons', 'bilancio', 'fiches'];

function useResolvedOrder(page: TabsPageKey) {
  const tabsPref = usePreferencesStore((s) => s.preferences.tabs);
  return useMemo(() => {
    const factory = TAB_DEFAULTS[page];
    const known = new Set(factory);
    const pref = tabsPref?.[page];
    const seen = new Set<string>();
    const order: string[] = [];
    for (const id of pref?.order ?? []) {
      if (known.has(id) && !seen.has(id)) { order.push(id); seen.add(id); }
    }
    for (const id of factory) {
      if (!seen.has(id)) order.push(id);
    }
    const hidden = new Set<string>((pref?.hidden ?? []).filter((h) => known.has(h)));
    return { order, hidden };
  }, [tabsPref, page]);
}

function PageReorder({ page }: { page: TabsPageKey }) {
  const { order, hidden } = useResolvedOrder(page);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const persist = async (nextOrder: string[], nextHidden: string[]) => {
    try {
      await updatePreferences({
        tabs: { [page]: { order: nextOrder, hidden: nextHidden } },
      });
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    }
  };

  const visibleCount = order.filter((id) => !hidden.has(id)).length;

  const onReorder = (next: string[]) => {
    void persist(next, [...hidden]);
  };

  const toggleHide = (id: string) => {
    const isHidden = hidden.has(id);
    // Never let the user hide the last visible tab.
    if (!isHidden && visibleCount <= 1) {
      messagePopup.getState().info('Almeno una scheda deve restare visibile');
      return;
    }
    const next = new Set(hidden);
    if (isHidden) next.delete(id); else next.add(id);
    void persist(order, [...next]);
  };

  const reset = () => {
    void persist([], []);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {TAB_PAGE_LABELS[page]}
        </h3>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <RotateCcw className="size-3" />
          Ripristina
        </button>
      </div>

      <Reorder.Group axis="y" values={order} onReorder={onReorder} className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {order.map((id) => {
          const isHidden = hidden.has(id);
          return (
            <Reorder.Item
              key={id}
              value={id}
              className="px-4 py-2.5 flex items-center gap-3 bg-white dark:bg-zinc-900"
              whileDrag={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            >
              <span className="text-zinc-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing">
                <GripVertical className="size-4" />
              </span>
              <span
                className={`flex-1 text-sm font-medium ${
                  isHidden
                    ? 'text-zinc-400 dark:text-zinc-600 line-through'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {TAB_LABELS[page][id] ?? id}
              </span>
              <button
                type="button"
                onClick={() => toggleHide(id)}
                aria-label={isHidden ? 'Mostra' : 'Nascondi'}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                {isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}

export function TabOrderPanel() {
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const resetAll = async () => {
    try {
      const empty = Object.fromEntries(
        PAGE_KEYS.map((k) => [k, { order: [], hidden: [] }]),
      );
      await updatePreferences({ tabs: empty });
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={LayoutList}
        title="Ordine e visibilità delle schede"
        description="Trascina le schede per riordinarle, nascondi quelle che non usi. La prima scheda visibile è quella che si apre per prima."
      >
        <p className="text-xs text-zinc-500">
          Le modifiche sono immediate e si applicano alla prossima visita di ogni pagina.
        </p>
      </SettingsCard>

      {PAGE_KEYS.map((page) => (
        <PageReorder key={page} page={page} />
      ))}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <RotateCcw className="size-3.5" />
          Ripristina tutti i default
        </button>
      </div>
    </div>
  );
}
