'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, Clock, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
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
  }, [entries, filter, typeFilter, mineOnly, mySalonIdResolved, sort]);

  const countFor = (status: FeedbackFilter) =>
    status === 'all' ? entries.length : entries.filter((e) => e.status === status).length;

  return (
    <>
      <AddFeedbackModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

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
              <span>Nuovo feedback</span>
            </button>
          ) : undefined}
        />

        {/* Status tabs */}
        <div className="flex flex-row items-center flex-wrap gap-3">
          <div className="flex flex-row items-center gap-1 p-1 rounded-lg border border-zinc-500/25 bg-zinc-100/50 dark:bg-zinc-800/50">
            {STATUS_OPTIONS.map(({ value, label }) => {
              const isActive = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`flex flex-row items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-xs tabular-nums ${isActive ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {countFor(value)}
                  </span>
                </button>
              );
            })}
          </div>

          {mySalonIdResolved && !isPlatformView && (
            <button
              type="button"
              onClick={() => setMineOnly(!mineOnly)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                mineOnly
                  ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/70'
                  : 'border-zinc-500/25 bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              Le mie
            </button>
          )}

          <button
            type="button"
            onClick={() => setSort(sort === 'top' ? 'recent' : 'top')}
            className="ml-auto flex flex-row items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-zinc-500/25 bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 transition-colors"
          >
            {sort === 'top' ? <ArrowDownWideNarrow className="size-3.5" /> : <Clock className="size-3.5" />}
            {sort === 'top' ? 'Più votate' : 'Più recenti'}
          </button>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-row items-center flex-wrap gap-2">
          <TypeChip value="all" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          {TYPE_ORDER.map((t) => (
            <TypeChip
              key={t}
              value={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
            />
          ))}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : visibleEntries.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={filter === 'completed' ? 'Nessun feedback completato' : 'Nessun feedback'}
            description={filter === 'completed'
              ? 'Quando un feedback verrà completato, apparirà qui.'
              : isPlatformView
                ? 'Nessun salone ha ancora inviato feedback.'
                : 'Sii il primo a condividere un suggerimento, segnalare un bug o proporre un\'idea.'}
            action={!isPlatformView && filter !== 'completed'
              ? { label: 'Nuovo feedback', icon: Plus, onClick: () => setShowAdd(true) }
              : undefined}
          />
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

interface TypeChipProps {
  value: FeedbackTypeFilter;
  active: boolean;
  onClick: () => void;
}

function TypeChip({ value, active, onClick }: TypeChipProps) {
  if (value === 'all') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          active
            ? 'border-zinc-700 dark:border-zinc-300 bg-zinc-700/10 dark:bg-zinc-300/10 text-zinc-800 dark:text-zinc-200'
            : 'border-zinc-500/25 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
        }`}
      >
        Tutti i tipi
      </button>
    );
  }
  const meta = TYPE_META[value];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? meta.badge + ' border-current/40'
          : 'border-zinc-500/25 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
      }`}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {meta.label}
    </button>
  );
}
