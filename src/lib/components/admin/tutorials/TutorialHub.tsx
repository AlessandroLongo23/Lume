'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { tutorials } from '@/lib/tutorials/registry';
import {
  COMPLEXITY_LABELS,
  COMPLEXITY_ORDER,
  SCOPE_LABELS,
  SCOPE_ORDER,
  type Tutorial,
} from '@/lib/tutorials/types';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TutorialCard } from './TutorialCard';

type GroupBy = 'complexity' | 'scope';

const GROUP_OPTIONS: GroupBy[] = ['complexity', 'scope'];
const GROUP_LABELS = ['Per livello', 'Per area'];

/**
 * Searchable text for one tutorial: its title, summary (the description shown on
 * the card) and the human-readable "tags" — the complexity badge and scope chips
 * the user actually sees — so the search box matches the same words on screen.
 */
function searchHaystack(t: Tutorial): string {
  return [
    t.title,
    t.summary,
    COMPLEXITY_LABELS[t.complexity],
    ...t.scopes.map((s) => SCOPE_LABELS[s]),
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * The Help Center hub: the same tutorial list, grouped two ways. "Per livello"
 * (complexity) is the learning-path view; "Per area" (scope) is the deep-dive
 * view. A search box narrows the list by title, description and tags before
 * grouping. Completion comes from `preferences.tutorials.completedIds`.
 */
export function TutorialHub() {
  const [groupBy, setGroupBy] = useState<GroupBy>('complexity');
  const [query, setQuery] = useState('');
  const completedIds = usePreferencesStore((s) => s.preferences.tutorials?.completedIds);
  const completed = useMemo(() => new Set(completedIds ?? []), [completedIds]);

  const terms = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );

  const visible = useMemo(() => {
    if (terms.length === 0) return tutorials;
    return tutorials.filter((t) => {
      const haystack = searchHaystack(t);
      return terms.every((term) => haystack.includes(term));
    });
  }, [terms]);

  const groups = useMemo(() => {
    if (groupBy === 'complexity') {
      return COMPLEXITY_ORDER.map((key) => ({
        key,
        label: COMPLEXITY_LABELS[key],
        items: visible.filter((t) => t.complexity === key),
      })).filter((g) => g.items.length > 0);
    }
    return SCOPE_ORDER.map((key) => ({
      key,
      label: SCOPE_LABELS[key],
      items: visible.filter((t) => t.scopes.includes(key)),
    })).filter((g) => g.items.length > 0);
  }, [groupBy, visible]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Searchbar
          value={query}
          onChange={setQuery}
          placeholder="Cerca un tutorial..."
          className="w-full sm:w-72"
        />
        <ToggleButton
          options={GROUP_OPTIONS}
          value={groupBy}
          onChange={(g) => setGroupBy(g as GroupBy)}
          labels={GROUP_LABELS}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nessun tutorial trovato"
          description={`Nessun risultato per "${query.trim()}". Prova con un altro termine.`}
          action={{ label: 'Cancella ricerca', onClick: () => setQuery('') }}
        />
      ) : (
        groups.map((group) => (
          <section key={String(group.key)} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((t) => (
                <TutorialCard key={t.id} tutorial={t} completed={completed.has(t.id)} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
