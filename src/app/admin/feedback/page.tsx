'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { useFeedbackStore, type FeedbackFilter } from '@/lib/stores/feedback';
import { FeedbackCard } from '@/lib/components/admin/feedback/FeedbackCard';
import { AddFeedbackModal } from '@/lib/components/admin/feedback/AddFeedbackModal';
import { FeedbackDetailModal } from '@/lib/components/admin/feedback/FeedbackDetailModal';
import type { FeedbackEntry } from '@/lib/types/FeedbackEntry';

const FILTER_OPTIONS: { value: FeedbackFilter; label: string }[] = [
  { value: 'open', label: 'Aperti' },
  { value: 'in_progress', label: 'In lavorazione' },
  { value: 'completed', label: 'Completati' },
  { value: 'all', label: 'Tutti' },
];

export default function FeedbackPage() {
  const entries = useFeedbackStore((s) => s.entries);
  const isLoading = useFeedbackStore((s) => s.isLoading);
  const filter = useFeedbackStore((s) => s.filter);
  const setFilter = useFeedbackStore((s) => s.setFilter);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  // Derive `selected` fresh from the store each render — avoids an effect that
  // would otherwise cause cascading renders keeping a stale copy in sync.
  const selected: FeedbackEntry | null = selectedId
    ? entries.find((e) => e.id === selectedId) ?? null
    : null;

  const visibleEntries = useMemo(() => {
    const list = filter === 'all' ? entries : entries.filter((e) => e.status === filter);
    return [...list].sort((a, b) => {
      if (filter === 'completed') {
        const at = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bt - at;
      }
      if (b.upvote_count !== a.upvote_count) return b.upvote_count - a.upvote_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [entries, filter]);

  return (
    <>
      <AddFeedbackModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <FeedbackDetailModal entry={selected} currentUserId={currentUserId} onClose={() => setSelectedId(null)} />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Feedback"
          subtitle="Suggerisci, segnala, vota. Costruiamo Lume insieme."
          icon={MessageSquare}
          actions={
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="size-5" />
              <span>Nuovo feedback</span>
            </button>
          }
        />

        {/* Filter tabs */}
        <div className="flex flex-row items-center gap-1 p-1 rounded-lg border border-zinc-500/25 bg-zinc-100/50 dark:bg-zinc-800/50 self-start">
          {FILTER_OPTIONS.map(({ value, label }) => {
            const isActive = filter === value;
            const count = value === 'all'
              ? entries.length
              : entries.filter((e) => e.status === value).length;
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
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : visibleEntries.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={filter === 'completed' ? 'Nessun feedback completato' : 'Nessun feedback ancora'}
            description={filter === 'completed'
              ? 'Quando un feedback verrà completato, apparirà qui.'
              : 'Sii il primo a condividere un suggerimento, segnalare un bug o proporre un\'idea.'}
            action={filter !== 'completed'
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
                onClick={() => setSelectedId(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
