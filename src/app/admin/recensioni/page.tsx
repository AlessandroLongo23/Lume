'use client';

import { useEffect, useState } from 'react';
import { Save, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useReviewsStore } from '@/lib/stores/reviews';
import { formatDateDisplay } from '@/lib/utils/format';

const MAX_MESSAGE = 2000;

export default function ReviewsPage() {
  const myReview = useReviewsStore((s) => s.myReview);
  const isLoading = useReviewsStore((s) => s.isLoading);
  const fetchMyReview = useReviewsStore((s) => s.fetchMyReview);
  const upsertMyReview = useReviewsStore((s) => s.upsertMyReview);
  const deleteMyReview = useReviewsStore((s) => s.deleteMyReview);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyReview();
  }, [fetchMyReview]);

  // Sync local form state with the loaded review (also re-syncs if the store
  // changes via realtime, e.g. the review is deleted in another session).
  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setMessage(myReview?.message ?? '');
  }, [myReview]);

  const trimmedLength = message.trim().length;
  const isEdit = myReview !== null;
  const isDirty =
    !isEdit
      ? rating > 0 || trimmedLength > 0
      : rating !== myReview.rating || message.trim() !== myReview.message;
  const canSave = rating >= 1 && rating <= 5 && trimmedLength >= 1 && isDirty && !isSaving;
  const displayedRating = hoverRating || rating;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await upsertMyReview({ rating, message: message.trim() });
      messagePopup.getState().success(isEdit ? 'Recensione aggiornata. Grazie!' : 'Recensione pubblicata. Grazie!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante il salvataggio: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMyReview();
      messagePopup.getState().success('Recensione eliminata.');
      setShowDelete(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error("Errore durante l'eliminazione: " + msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass = 'w-full p-3 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-shadow';

  return (
    <>
      <DeleteModal
        isOpen={showDelete}
        onClose={() => (isDeleting ? null : setShowDelete(false))}
        onConfirm={handleDelete}
        title="Elimina recensione"
        subtitle="La tua recensione verrà rimossa definitivamente."
        confirmText={isDeleting ? 'Eliminazione…' : 'Elimina'}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="La tua recensione"
          subtitle="Raccontaci come stai trovando Lume. La tua recensione potrebbe apparire sulla landing page."
          icon={Star}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Voto</label>
              <div className="flex flex-row items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= displayedRating;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} stelle`}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <Star
                        className={`size-9 transition-colors ${
                          filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  );
                })}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{rating}/5</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Messaggio <span className="text-zinc-400 font-normal">({trimmedLength}/{MAX_MESSAGE})</span>
              </label>
              <textarea
                rows={8}
                maxLength={MAX_MESSAGE}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cosa funziona, cosa miglioreresti, a chi consiglieresti Lume…"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {isEdit && myReview
                  ? myReview.created_at === myReview.updated_at
                    ? `Pubblicata il ${formatDateDisplay(myReview.created_at, 'PPp')}`
                    : `Ultima modifica: ${formatDateDisplay(myReview.updated_at, 'PPp')}`
                  : 'Non hai ancora lasciato una recensione.'}
              </div>

              <div className="flex flex-row items-center gap-3 shrink-0">
                {isEdit && (
                  <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="flex flex-row items-center gap-2 px-3 py-2 text-sm font-thin rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                    <span>Elimina</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="flex flex-row items-center gap-2 px-4 py-2 text-sm font-thin rounded-lg bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 border border-zinc-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="size-4" strokeWidth={1.5} />
                  <span>{isSaving ? 'Salvataggio…' : isEdit ? 'Aggiorna' : 'Salva'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
