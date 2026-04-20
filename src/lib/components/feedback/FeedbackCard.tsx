'use client';

import { ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFeedbackStore } from '@/lib/stores/feedback';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { FeedbackEntry } from '@/lib/types/FeedbackEntry';
import { TYPE_META, STATUS_META } from './feedback-meta';

interface FeedbackCardProps {
  entry: FeedbackEntry;
  currentUserId: string | null;
  isAdmin: boolean;
  onClick: () => void;
  showSalonBadge?: boolean;
  allowUpvote?: boolean;
}

export function FeedbackCard({
  entry,
  currentUserId,
  isAdmin,
  onClick,
  showSalonBadge = false,
  allowUpvote = true,
}: FeedbackCardProps) {
  const hasVoted = useFeedbackStore((s) => s.myUpvoteIds.has(entry.id));
  const toggleUpvote = useFeedbackStore((s) => s.toggleUpvote);
  const typeMeta = TYPE_META[entry.type];
  const statusMeta = STATUS_META[entry.status];
  const isOwnEntry = currentUserId !== null && entry.author_id === currentUserId;
  const canVote = allowUpvote && (!isOwnEntry || isAdmin);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canVote) return;
    try {
      await toggleUpvote(entry.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Voto non registrato: ' + msg);
    }
  };

  const excerpt = entry.description.length > 220
    ? entry.description.slice(0, 220).trimEnd() + '…'
    : entry.description;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-row items-start gap-4 w-full text-left p-4 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
    >
      {/* Upvote column */}
      {allowUpvote ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleVote}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleVote(e as unknown as React.MouseEvent); }
          }}
          aria-label={hasVoted ? 'Rimuovi voto' : 'Vota'}
          aria-disabled={!canVote}
          className={`flex shrink-0 flex-col items-center justify-center gap-0.5 w-14 py-2 rounded-lg border transition-colors ${
            hasVoted
              ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/70'
              : 'border-zinc-500/25 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
          } ${canVote ? 'hover:border-primary/70 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
        >
          <ChevronUp className="size-4" strokeWidth={2.5} />
          <span className="text-sm font-semibold tabular-nums">{entry.upvote_count}</span>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 w-14 py-2 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
          <ChevronUp className="size-4" strokeWidth={2.5} />
          <span className="text-sm font-semibold tabular-nums">{entry.upvote_count}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex flex-row items-center flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta.badge}`}>
            <typeMeta.icon className="size-3.5" strokeWidth={2} />
            {typeMeta.label}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.badge}`}>
            {statusMeta.label}
          </span>
          {showSalonBadge && entry.author_salon_name && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {entry.author_salon_name}
            </span>
          )}
          {isOwnEntry && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 dark:text-zinc-400">
              Tuo
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {entry.title}
        </h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 whitespace-pre-wrap">
          {excerpt}
        </p>

        <div className="flex flex-row items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{entry.getAuthorName()}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span>{format(new Date(entry.created_at), 'd MMM yyyy', { locale: it })}</span>
          {entry.completed_at && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Completato il {format(new Date(entry.completed_at), 'd MMM yyyy', { locale: it })}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
