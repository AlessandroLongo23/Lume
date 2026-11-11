'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, Clock, MessageSquare, Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { Button } from '@/lib/components/shared/ui/Button';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';
import { FacetedFilter, type FacetedFilterOption } from '@/lib/components/admin/table/FacetedFilter';
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

const TYPE_OPTIONS: FacetedFilterOption[] = TYPE_ORDER.map((t) => {
  const Icon = TYPE_META[t].icon;
  return {
    value: t,
    label: TYPE_META[t].label,
    prefix: <Icon className="size-3.5 text-[var(--lume-text-secondary)]" aria-hidden />,
  };
});

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
          actions={!isPlatformView ? (
            <Button variant="primary" leadingIcon={Plus} onClick={() => setShowAdd(true)}>
              {newLabel}
            </Button>
          ) : undefined}
        />

        {/* Status tabs */}
        <TabBar label="Stato dei feedback">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <TabButton key={value} active={isActive} count={countFor(value)} onClick={() => setFilter(value)}>
                {label}
              </TabButton>
            );
          })}
        </TabBar>

        {/* Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <Searchbar
            placeholder="Cerca feedback..."
            value={searchQuery}
            onChange={setSearchQuery}
            bindShortcut={false}
            className="flex-1 basis-full sm:basis-auto sm:max-w-sm"
          />

          <FacetedFilter
            label="Tipo"
            options={TYPE_OPTIONS}
            selected={typeFilter === 'all' ? [] : [typeFilter]}
            // One type at a time: the newly ticked row replaces the old one.
            onChange={(next) => {
              const added = next.find((v) => v !== typeFilter) as FeedbackType | undefined;
              setTypeFilter(added ?? 'all');
            }}
          />

          {mySalonIdResolved && !isPlatformView && (
            <Button
              variant="secondary"
              onClick={() => setMineOnly(!mineOnly)}
              pressed={mineOnly}
            >
              Le mie
            </Button>
          )}

          <Button
            variant="secondary"
            leadingIcon={sort === 'top' ? ArrowDownWideNarrow : Clock}
            onClick={() => setSort(sort === 'top' ? 'recent' : 'top')}
            className="ml-auto"
          >
            {sort === 'top' ? 'Più votate' : 'Più recenti'}
          </Button>
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

