'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, ChevronDown, ArrowRight } from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';
import { FacetedFilter, type FacetedFilterOption } from '@/lib/components/admin/table/FacetedFilter';
import { Button } from '@/lib/components/shared/ui/Button';
import { formatDateDisplay } from '@/lib/utils/format';
import { describeActivity, activityChanges, entityLabel, actionLabel } from '@/lib/utils/activityLog';
import type { ActivityLog, ActivityAction } from '@/lib/types/ActivityLog';

const ACTION_DOT: Record<ActivityAction, string> = {
  create: 'bg-[var(--lume-success-fg)]',
  update: 'bg-primary',
  delete: 'bg-[var(--lume-danger-fg)]',
  bulk: 'bg-[var(--lume-warning-fg)]',
};

const ALL_ACTIONS: ActivityAction[] = ['create', 'update', 'delete', 'bulk'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Oggi';
  if (isYesterday(d)) return 'Ieri';
  const s = formatDateDisplay(d, 'EEEE d MMMM yyyy');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ActivityRow({ entry }: { entry: ActivityLog }) {
  const [open, setOpen] = useState(false);
  const changes = activityChanges(entry);
  const hasDetail = changes.length > 0;
  const actor = entry.actor_name ?? 'Sistema';
  const time = formatDateDisplay(entry.created_at, 'HH:mm');

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 first:border-t-0">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        aria-expanded={hasDetail ? open : undefined}
        className={[
          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
          hasDetail ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        <span
          className={`shrink-0 size-2 rounded-full ${ACTION_DOT[entry.action] ?? 'bg-zinc-400'}`}
          aria-hidden
        />
        <span className="flex-1 text-sm text-foreground">
          <span className="font-medium">{actor}</span>{' '}
          {describeActivity(entry)}{' '}
          <span className="text-muted-foreground">alle {time}</span>
        </span>
        {hasDetail && (
          <ChevronDown
            className={`shrink-0 size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-9 flex flex-col gap-3">
              {changes.map((ch, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {ch.label}
                  </span>
                  {ch.isDiff ? (
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-zinc-400 dark:text-zinc-500 line-through decoration-1 decoration-zinc-300 dark:decoration-zinc-600">
                        {ch.before}
                      </span>
                      <ArrowRight className="size-3.5 text-zinc-400 shrink-0" />
                      <span className="text-foreground font-medium">{ch.after}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-foreground">{ch.after}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  const [query, setQuery] = useState('');
  const [operatore, setOperatore] = useState<string[]>([]);
  const [tipo, setTipo] = useState<string[]>([]);
  const [azione, setAzione] = useState<string[]>([]);

  const operatoreOptions = useMemo<FacetedFilterOption[]>(() => {
    const set = new Set(items.map((e) => e.actor_name ?? 'Sistema'));
    return Array.from(set).sort().map((v) => ({ value: v, label: v }));
  }, [items]);

  const tipoOptions = useMemo<FacetedFilterOption[]>(() => {
    const set = new Set(items.map((e) => e.entity_type));
    return Array.from(set)
      .map((v) => ({ value: v, label: entityLabel(v) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  const azioneOptions = useMemo<FacetedFilterOption[]>(
    () => ALL_ACTIONS.map((a) => ({ value: a, label: actionLabel(a) })),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((e) => {
      if (operatore.length && !operatore.includes(e.actor_name ?? 'Sistema')) return false;
      if (tipo.length && !tipo.includes(e.entity_type)) return false;
      if (azione.length && !azione.includes(e.action)) return false;
      if (q) {
        const hay = [
          e.actor_name ?? 'Sistema',
          describeActivity(e),
          entityLabel(e.entity_type),
          ...activityChanges(e).flatMap((ch) => [ch.label, ch.before ?? '', ch.after]),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, operatore, tipo, azione, query]);

  // `filtered` keeps the store's created_at-desc order, so groups and the rows
  // inside them stay newest-first without re-sorting.
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: ActivityLog[] }>();
    for (const e of filtered) {
      const k = dayKey(e.created_at);
      let g = map.get(k);
      if (!g) { g = { key: k, label: dayLabel(e.created_at), items: [] }; map.set(k, g); }
      g.items.push(e);
    }
    return Array.from(map.values());
  }, [filtered]);

  const hasFilters = query.trim() !== '' || operatore.length > 0 || tipo.length > 0 || azione.length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca nell'attività..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-[var(--lume-control-h-md)] pl-9 pr-8 text-[length:var(--lume-control-text-md)] bg-transparent border rounded-lg
              border-zinc-200 dark:border-zinc-800
              focus:border-zinc-300 dark:focus:border-zinc-700
              text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400 outline-none transition-colors"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Azzera ricerca"
              onClick={() => setQuery('')}
              className="absolute right-1"
            >
              <X />
            </Button>
          )}
        </div>
        <FacetedFilter label="Operatore" options={operatoreOptions} selected={operatore} onChange={setOperatore} />
        <FacetedFilter label="Tipo" options={tipoOptions} selected={tipo} onChange={setTipo} />
        <FacetedFilter label="Azione" options={azioneOptions} selected={azione} onChange={setAzione} />
      </div>

      {/* Feed grouped by day */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-6 text-center">
            {hasFilters ? 'Nessuna attività corrisponde ai filtri.' : 'Nessuna attività.'}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 px-1">
                {group.label}
              </h3>
              <div className="overflow-hidden bg-card border border-border rounded-xl">
                {group.items.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
