'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';
import { useFeedbackStore, type FeedbackFilter } from '@/lib/stores/feedback';
import { FeedbackCard } from '@/lib/components/feedback/FeedbackCard';
import { FeedbackDetailModal } from '@/lib/components/feedback/FeedbackDetailModal';
import type { FeedbackEntry } from '@/lib/types/FeedbackEntry';

const FILTER_OPTIONS: { value: FeedbackFilter; label: string }[] = [
  { value: 'open', label: 'Aperti' },
  { value: 'in_progress', label: 'In lavorazione' },
  { value: 'completed', label: 'Completati' },
  { value: 'all', label: 'Tutti' },
];

export default function PlatformFeedbackPage() {
  const entries = useFeedbackStore((s) => s.entries);
  const isLoading = useFeedbackStore((s) => s.isLoading);
  const filter = useFeedbackStore((s) => s.filter);
  const setFilter = useFeedbackStore((s) => s.setFilter);
  const fetchEntries = useFeedbackStore((s) => s.fetchEntries);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, [fetchEntries]);

  useRealtimeStore('feedback_entries', fetchEntries);
  useRealtimeStore('feedback_upvotes', fetchEntries);

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
      <FeedbackDetailModal
        entry={selected}
        currentUserId={currentUserId}
        isAdmin={true}
        allowUpvote={false}
        showSalonBadge
        onClose={() => setSelectedId(null)}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Feedback"
          subtitle="Richieste da tutti i saloni, ordinate per voti"
          icon={MessageSquare}
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
              : 'Nessun salone ha ancora inviato feedback.'}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {visibleEntries.map((entry) => (
              <FeedbackCard
                key={entry.id}
                entry={entry}
                currentUserId={currentUserId}
                isAdmin={true}
                showSalonBadge
                allowUpvote={false}
                onClick={() => setSelectedId(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
