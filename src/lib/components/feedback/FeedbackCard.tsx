'use client';

import Link from 'next/link';
import { ChevronUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFeedbackStore } from '@/lib/stores/feedback';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { FeedbackEntry } from '@/lib/types/FeedbackEntry';
import { Tag } from '@/lib/components/shared/ui/Tag';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { TYPE_META, STATUS_META } from './feedback-meta';

interface FeedbackCardProps {
  entry: FeedbackEntry;
  currentUserId: string | null;
  isAdmin: boolean;
  href: string;
  allowUpvote?: boolean;
}

export function FeedbackCard({
  entry,
  currentUserId,
  isAdmin,
  href,
  allowUpvote = true,
}: FeedbackCardProps) {
  const hasVoted = useFeedbackStore((s) => s.myUpvoteIds.has(entry.id));
  const toggleUpvote = useFeedbackStore((s) => s.toggleUpvote);
  const typeMeta = TYPE_META[entry.type];
  const statusMeta = STATUS_META[entry.status];
  const isOwnEntry = currentUserId !== null && entry.author_id === currentUserId;
  const canVote = allowUpvote && (!isOwnEntry || isAdmin);

  const handleVote = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
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
    <Link
      href={href}
      className="surface-card card-interactive group flex flex-row items-start gap-4 w-full text-left p-4"
    >
      {/* Upvote column */}
      {allowUpvote ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleVote}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleVote(e);
          }}
          aria-label={hasVoted ? 'Rimuovi voto' : 'Vota'}
          aria-disabled={!canVote}
          className={`flex shrink-0 flex-col items-center justify-center gap-0.5 w-14 py-2 rounded-lg transition-colors ${
            hasVoted
              ? 'selected'
              : 'shadow-[inset_0_0_0_1px_var(--lume-edge)] text-[var(--lume-text-secondary)]'
          } ${canVote ? 'hover:text-[var(--lume-text)] hover:shadow-[inset_0_0_0_1px_var(--lume-edge-hover)] cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
        >
          <ChevronUp className="size-4" strokeWidth={2.5} />
          <span className="text-sm font-medium tabular-nums">{entry.upvote_count}</span>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 w-14 py-2 rounded-lg shadow-[inset_0_0_0_1px_var(--lume-edge)] text-[var(--lume-text-secondary)]">
          <ChevronUp className="size-4" strokeWidth={2.5} />
          <span className="text-sm font-medium tabular-nums">{entry.upvote_count}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex flex-row items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lume-text-secondary)]">
            <typeMeta.icon className={`size-3.5 ${typeMeta.badge}`} strokeWidth={2} />
            {typeMeta.label}
          </span>
          <StatusDot tone={statusMeta.tone} className="text-xs font-medium">{statusMeta.label}</StatusDot>
          {entry.author_salon_name && (
            <span className="inline-flex items-center text-xs text-[var(--lume-text-secondary)]">
              {entry.author_salon_name}
            </span>
          )}
          {isOwnEntry && (
            <Tag>Tuo</Tag>
          )}
        </div>

        <h3 className="text-sm font-medium text-[var(--lume-text)] line-clamp-2">
          {entry.title}
        </h3>

        <p className="text-sm text-[var(--lume-text-secondary)] line-clamp-2 whitespace-pre-wrap">
          {excerpt}
        </p>

        <div className="flex flex-row items-center gap-2 text-xs text-[var(--lume-text-secondary)]">
          <span>{entry.getAuthorName()}</span>
          <span className="text-[var(--lume-text-muted)]">·</span>
          <span>{format(new Date(entry.created_at), 'd MMM yyyy', { locale: it })}</span>
          {entry.comment_count > 0 && (
            <>
              <span className="text-[var(--lume-text-muted)]">·</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3" />
                <span className="tabular-nums">{entry.comment_count}</span>
              </span>
            </>
          )}
          {entry.completed_at && (
            <>
              <span className="text-[var(--lume-text-muted)]">·</span>
              <span>
                Completato il {format(new Date(entry.completed_at), 'd MMM yyyy', { locale: it })}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
