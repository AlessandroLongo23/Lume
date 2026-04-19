'use client';

import { ChevronUp, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { useFeedbackStore } from '@/lib/stores/feedback';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { FeedbackEntry, FeedbackStatus } from '@/lib/types/FeedbackEntry';
import { TYPE_META, STATUS_META } from './feedback-meta';

interface FeedbackDetailModalProps {
  entry: FeedbackEntry | null;
  currentUserId: string | null;
  onClose: () => void;
}

const STATUS_OPTIONS: FeedbackStatus[] = ['open', 'in_progress', 'completed', 'closed'];

export function FeedbackDetailModal({ entry, currentUserId, onClose }: FeedbackDetailModalProps) {
  const hasVoted = useFeedbackStore((s) => (entry ? s.myUpvoteIds.has(entry.id) : false));
  const toggleUpvote = useFeedbackStore((s) => s.toggleUpvote);
  const updateEntry = useFeedbackStore((s) => s.updateEntry);
  const deleteEntry = useFeedbackStore((s) => s.deleteEntry);
  const isSuperAdmin = useSubscriptionStore((s) => s.isSuperAdmin);

  if (!entry) return null;

  const typeMeta = TYPE_META[entry.type];
  const statusMeta = STATUS_META[entry.status];
  const isOwnEntry = currentUserId !== null && entry.author_id === currentUserId;
  const canVote = !isOwnEntry || isSuperAdmin;
  const canDelete = isSuperAdmin || (isOwnEntry && entry.status === 'open');

  const handleVote = async () => {
    if (!canVote) return;
    try {
      await toggleUpvote(entry.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Voto non registrato: ' + msg);
    }
  };

  const handleStatusChange = async (next: FeedbackStatus) => {
    if (next === entry.status) return;
    try {
      await updateEntry(entry.id, { status: next });
      messagePopup.getState().success('Stato aggiornato');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Eliminare definitivamente questo feedback?')) return;
    try {
      await deleteEntry(entry.id);
      messagePopup.getState().success('Feedback eliminato');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante l\'eliminazione: ' + msg);
    }
  };

  return (
    <Modal isOpen={!!entry} onClose={onClose} classes="max-w-2xl">
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-row items-start justify-between gap-4 p-6 border-b border-zinc-500/25 shrink-0">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex flex-row items-center flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta.badge}`}>
                <typeMeta.icon className="size-3.5" strokeWidth={2} />
                {typeMeta.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.badge}`}>
                {statusMeta.label}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 break-words">
              {entry.title}
            </h2>
            <div className="flex flex-row items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{entry.getAuthorName()}</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>{format(new Date(entry.created_at), 'd MMMM yyyy', { locale: it })}</span>
            </div>
          </div>
          <button
            aria-label="Chiudi"
            className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {entry.description}
          </p>
        </div>

        {/* Super admin controls */}
        {isSuperAdmin && (
          <div className="flex flex-col gap-2 px-6 py-4 border-t border-zinc-500/25 bg-primary/5">
            <label className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-primary/70">
              Stato (solo admin)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((s) => {
                const isSelected = entry.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/70'
                        : 'border-zinc-500/25 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-row items-center justify-between gap-3 p-6 border-t border-zinc-500/25 shrink-0">
          <button
            type="button"
            onClick={handleVote}
            disabled={!canVote}
            className={`flex flex-row items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              hasVoted
                ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/70'
                : 'border-zinc-500/25 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-primary/70'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ChevronUp className="size-4" strokeWidth={2.5} />
            <span className="tabular-nums">{entry.upvote_count}</span>
            <span>{hasVoted ? 'Votato' : 'Vota'}</span>
          </button>

          <div className="flex flex-row items-center gap-3">
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex flex-row items-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 className="size-4" />
                Elimina
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex flex-row items-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
