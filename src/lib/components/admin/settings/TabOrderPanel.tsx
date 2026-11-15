'use client';

import { useMemo } from 'react';
import { Reorder } from 'motion/react';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { SwapIcon } from '@/lib/components/shared/ui/SwapIcon';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
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
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-[var(--lume-text)]">
          {TAB_PAGE_LABELS[page]}
        </h4>
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={reset}>
          Ripristina
        </Button>
      </div>

      <Reorder.Group axis="y" values={order} onReorder={onReorder} className="divide-y divide-line border-y border-line">
        {order.map((id) => {
          const isHidden = hidden.has(id);
          return (
            <Reorder.Item
              key={id}
              value={id}
              className="relative py-1.5 flex items-center gap-3 bg-[var(--lume-panel)] rounded-md"
              whileDrag={{ scale: 1.01, boxShadow: 'var(--lume-shadow-float)' }}
            >
              <span className="text-[var(--lume-text-muted)] cursor-grab active:cursor-grabbing touch-none">
                <GripVertical className="size-4" />
              </span>
              <span
                className={`flex-1 text-sm font-medium ${
                  isHidden
                    ? 'text-[var(--lume-text-muted)] line-through'
                    : 'text-[var(--lume-text)]'
                }`}
              >
                {TAB_LABELS[page][id] ?? id}
              </span>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => toggleHide(id)}
                aria-label={isHidden ? 'Mostra' : 'Nascondi'}
              >
                <SwapIcon icon={isHidden ? EyeOff : Eye} className="size-4" />
              </Button>
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
        title="Ordine e visibilità delle schede"
        description="Trascina le schede per riordinarle, nascondi quelle che non usi. La prima scheda visibile è quella che si apre per prima."
      >
        <p className="text-xs text-[var(--lume-text-muted)]">
          Le modifiche sono immediate e si applicano alla prossima visita di ogni pagina.
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {PAGE_KEYS.map((page) => (
            <PageReorder key={page} page={page} />
          ))}
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={resetAll}>
          Ripristina tutti i default
        </Button>
      </div>
    </div>
  );
}
