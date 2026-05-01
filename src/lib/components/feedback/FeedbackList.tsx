'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownWideNarrow, Check, Clock, MessageSquare, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';
import {
  useFeedbackStore,
  type FeedbackFilter,
  type FeedbackTypeFilter,
} from '@/lib/stores/feedback';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import type { FeedbackType } from '@/lib/types/FeedbackEntry';
import { AddFeedbackModal } from './AddFeedbackModal';
import { FeedbackCard } from './FeedbackCard';
import { TYPE_META } from './feedback-meta';

type Mode = 'admin' | 'platform';

interface FeedbackListProps {
  mode: Mode;
}

const STATUS_OPTIONS: { value: FeedbackFilter; label: string }[] = [
  { value: 'open', label: 'Aperti' },
  { value: 'in_progress', label: 'In lavorazione' },
  { value: 'completed', label: 'Completati' },
  { value: 'all', label: 'Tutti' },
];

const TYPE_ORDER: FeedbackType[] = ['suggestion', 'bug', 'idea'];

export function FeedbackList({ mode }: FeedbackListProps) {
  const entries = useFeedbackStore((s) => s.entries);
  const isLoading = useFeedbackStore((s) => s.isLoading);
  const filter = useFeedbackStore((s) => s.filter);
  const setFilter = useFeedbackStore((s) => s.setFilter);
  const typeFilter = useFeedbackStore((s) => s.typeFilter);
  const setTypeFilter = useFeedbackStore((s) => s.setTypeFilter);
  const sort = useFeedbackStore((s) => s.sort);
  const setSort = useFeedbackStore((s) => s.setSort);
  const mineOnly = useFeedbackStore((s) => s.mineOnly);
  const setMineOnly = useFeedbackStore((s) => s.setMineOnly);
  const fetchEntries = useFeedbackStore((s) => s.fetchEntries);

  const subscriptionIsAdmin = useSubscriptionStore((s) => s.isAdmin);

  // The subscription store doesn't expose salon_id. Look it up once from the profiles
  // table so the "Le mie" filter has something to match against.
  const [mySalonIdResolved, setMySalonIdResolved] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Effective flags based on where this list is rendered.
  const isPlatformView = mode === 'platform';
  const isAdmin = isPlatformView ? true : subscriptionIsAdmin;
  const allowUpvote = !isPlatformView;

  useEffect(() => {
    fetchEntries();
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setCurrentUserId(uid);
      if (uid) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', uid)
          .single();
        setMySalonIdResolved(profile?.salon_id ?? null);
      }
    });
  }, [fetchEntries]);

  useEffect(() => {
    if (!typeDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [typeDropdownOpen]);

  useRealtimeStore('feedback_entries', fetchEntries);
  useRealtimeStore('feedback_upvotes', fetchEntries);

  const detailHrefFor = (id: string) =>
    isPlatformView ? `/platform/feedback/${id}` : `/admin/feedback/${id}`;

  const visibleEntries = useMemo(() => {
    let list = entries;
    if (filter !== 'all') list = list.filter((e) => e.status === filter);
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter);
    if (mineOnly && mySalonIdResolved) {
      list = list.filter((e) => e.author_salon_id === mySalonIdResolved);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const author = `${e.author_first_name ?? ''} ${e.author_last_name ?? ''}`.trim().toLowerCase();
        const salon = (e.author_salon_name ?? '').toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          author.includes(q) ||
          salon.includes(q)
        );
      });
    }
    return [...list].sort((a, b) => {
      if (filter === 'completed' && sort === 'top') {
        // On the completed tab, default to most-recently-completed even when sorting "top".
        const at = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bt - at;
      }
      if (sort === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (b.upvote_count !== a.upvote_count) return b.upvote_count - a.upvote_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [entries, filter, typeFilter, mineOnly, mySalonIdResolved, sort, searchQuery]);

  const countFor = (status: FeedbackFilter) =>
    status === 'all' ? entries.length : entries.filter((e) => e.status === status).length;

  const NEW_LABEL: Record<FeedbackTypeFilter, string> = {
    all: 'Nuovo feedback',
    suggestion: 'Nuovo suggerimento',
    bug: 'Nuovo problema',
    idea: 'Nuova idea',
  };
  const newLabel = NEW_LABEL[typeFilter];
  const modalInitialType = typeFilter === 'all' ? undefined : typeFilter;

  return (
    <>
      <AddFeedbackModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        initialType={modalInitialType}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Feedback"
          subtitle={isPlatformView
            ? 'Tutti i feedback dei saloni'
            : 'Suggerisci, segnala, vota. Costruiamo Lume insieme.'}
          icon={MessageSquare}
          actions={!isPlatformView ? (
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="size-5" />
              <span>{newLabel}</span>
            </button>
          ) : undefined}
        />

        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary-hover dark:text-primary/70'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
              >
                {label}
                <NumberBadge value={countFor(value)} variant={isActive ? 'primary' : 'neutral'} size="md" />
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="relative flex items-center flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
                border-zinc-200 dark:border-zinc-800
                focus:border-zinc-300 dark:focus:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div ref={typeDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setTypeDropdownOpen((o) => !o)}
              className={[
                'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
                typeFilter !== 'all'
                  ? 'bg-primary/10 border-primary/30 text-primary-hover dark:text-primary/70'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              ].join(' ')}
            >
              <SlidersHorizontal className="size-4" />
              <span>Tipo</span>
              {typeFilter !== 'all' && (
                <NumberBadge value={1} variant="solid" size="md" />
              )}
            </button>

            {typeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-dropdown w-52 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Filtra per tipo
                  </span>
                </div>
                <div className="py-1">
                  {TYPE_ORDER.map((t) => {
                    const meta = TYPE_META[t];
                    const Icon = meta.icon;
                    const checked = typeFilter === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTypeFilter(checked ? 'all' : t);
                          setTypeDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <span
                          className={[
                            'shrink-0 size-4 rounded border transition-colors flex items-center justify-center',
                            checked
                              ? 'bg-primary border-primary'
                              : 'border-zinc-300 dark:border-zinc-600',
                          ].join(' ')}
                        >
                          {checked && <Check className="size-3 text-white" />}
                        </span>
                        <Icon className="size-3.5 text-zinc-500" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                {typeFilter !== 'all' && (
                  <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => { setTypeFilter('all'); setTypeDropdownOpen(false); }}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      Azzera filtri
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {mySalonIdResolved && !isPlatformView && (
            <button
              type="button"
              onClick={() => setMineOnly(!mineOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                mineOnly
                  ? 'border-primary/30 bg-primary/10 text-primary-hover dark:text-primary/70'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              Le mie
            </button>
          )}

          <button
            type="button"
            onClick={() => setSort(sort === 'top' ? 'recent' : 'top')}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {sort === 'top' ? <ArrowDownWideNarrow className="size-3.5" /> : <Clock className="size-3.5" />}
            {sort === 'top' ? 'Più votate' : 'Più recenti'}
          </button>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : visibleEntries.length === 0 ? (
          searchQuery.trim() ? (
            <EmptyState
              icon={Search}
              title="Nessun risultato"
              description={`Nessun feedback corrisponde a "${searchQuery.trim()}".`}
            />
          ) : (() => {
            const TYPE_INFO: Record<FeedbackType, {
              noun: string;
              nounPlural: string;
              gender: 'm' | 'f';
              vowelStart: boolean;
              action: string;
            }> = {
              suggestion: { noun: 'suggerimento', nounPlural: 'suggerimenti', gender: 'm', vowelStart: false, action: 'condividere un suggerimento' },
              bug: { noun: 'problema', nounPlural: 'problemi', gender: 'm', vowelStart: false, action: 'segnalare un problema' },
              idea: { noun: 'idea', nounPlural: 'idee', gender: 'f', vowelStart: true, action: "proporre un'idea" },
            };

            const info = typeFilter !== 'all' ? TYPE_INFO[typeFilter] : null;
            const emptyIcon = typeFilter !== 'all' ? TYPE_META[typeFilter].icon : MessageSquare;
            const isFem = info?.gender === 'f';
            const elide = isFem && info?.vowelStart;
            const noun = info?.noun ?? 'feedback';
            const nounPl = info?.nounPlural ?? 'feedback';

            const nessunNoun = elide ? `Nessun'${noun}` : `Nessun ${noun}`;
            const unNoun = elide ? `un'${noun}` : `un ${noun}`;
            const aperto = isFem ? 'aperta' : 'aperto';
            const apertiPl = isFem ? 'aperte' : 'aperti';
            const completato = isFem ? 'completata' : 'completato';

            let title: string;
            let description: string;

            if (filter === 'completed') {
              title = `${nessunNoun} ${completato}`;
              description = `Quando ${unNoun} verrà ${completato}, apparirà qui.`;
            } else if (filter === 'in_progress') {
              title = `${nessunNoun} in lavorazione`;
              description = `Al momento non ci sono ${nounPl} in lavorazione.`;
            } else if (filter === 'open') {
              title = `${nessunNoun} ${aperto}`;
              description = `Non ci sono ${nounPl} ${apertiPl} al momento.`;
            } else {
              title = nessunNoun;
              description = isPlatformView
                ? 'Nessun salone ha ancora inviato feedback.'
                : info
                  ? `Sii il primo a ${info.action}.`
                  : "Sii il primo a condividere un suggerimento, segnalare un problema o proporre un'idea.";
            }

            return (
              <EmptyState
                icon={emptyIcon}
                title={title}
                description={description}
                action={!isPlatformView && filter !== 'completed'
                  ? { label: newLabel, icon: Plus, onClick: () => setShowAdd(true) }
                  : undefined}
              />
            );
          })()
        ) : (
          <div className="flex flex-col gap-3">
            {visibleEntries.map((entry) => (
              <FeedbackCard
                key={entry.id}
                entry={entry}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                href={detailHrefFor(entry.id)}
                allowUpvote={allowUpvote}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

