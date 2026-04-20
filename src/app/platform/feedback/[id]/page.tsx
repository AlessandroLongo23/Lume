'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { FeedbackDetailView } from '@/lib/components/feedback/FeedbackDetailView';
import { useFeedbackStore } from '@/lib/stores/feedback';

export default function PlatformFeedbackDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;

  const entry = useFeedbackStore((s) => (id ? s.getById(id) : null));
  const isLoading = useFeedbackStore((s) => s.isLoading);
  const fetchEntries = useFeedbackStore((s) => s.fetchEntries);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (!id) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="ID non valido"
        description="Questo feedback non può essere caricato."
      />
    );
  }

  if (isLoading && !entry) {
    return <TableSkeleton />;
  }

  if (!entry) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Feedback non trovato"
        description="Potrebbe essere stato eliminato o non esiste."
      />
    );
  }

  return (
    <FeedbackDetailView
      entry={entry}
      isAdmin
      backHref="/platform/feedback"
      allowUpvote={false}
    />
  );
}
