'use client';

import { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useFeedbackCommentsStore } from '@/lib/stores/feedbackComments';
import type { FeedbackComment } from '@/lib/types/FeedbackComment';
import { CommentCard } from './CommentCard';

interface CommentListProps {
  feedbackId: string;
  currentUserId: string | null;
}

// Stable empty-array reference: returning a literal [] from the selector when the
// key is missing would create a new array every render and trigger an infinite loop.
const EMPTY: FeedbackComment[] = [];

export function CommentList({ feedbackId, currentUserId }: CommentListProps) {
  const comments = useFeedbackCommentsStore((s) => s.byFeedbackId[feedbackId] ?? EMPTY);
  const isLoading = useFeedbackCommentsStore((s) => s.loadingIds.has(feedbackId));
  const fetch = useFeedbackCommentsStore((s) => s.fetch);
  const subscribe = useFeedbackCommentsStore((s) => s.subscribe);

  useEffect(() => {
    fetch(feedbackId);
    const unsubscribe = subscribe(feedbackId);
    return unsubscribe;
  }, [feedbackId, fetch, subscribe]);

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4">
        <div className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
        <div className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-400 dark:text-zinc-500">
        <MessageSquare className="size-6" />
        <p className="text-sm">Nessun commento ancora. Sii il primo a condividere un pensiero.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <CommentCard key={c.id} comment={c} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
