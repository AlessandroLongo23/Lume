'use client';

import { useEffect, useState } from 'react';
import { Save, Star, Trash2 } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { StarRating } from '@/lib/components/shared/ui/StarRating';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { RichTextEditor } from '@/lib/components/shared/ui/RichTextEditor';
import { Button } from '@/lib/components/shared/ui/Button';
import { useReviewsStore } from '@/lib/stores/reviews';
import { formatDateDisplay } from '@/lib/utils/format';

const MAX_MESSAGE = 2000;

function plainTextLength(html: string): number {
  if (!html) return 0;
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, '').trim().length;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').trim().length;
}

export default function ReviewsPage() {
  const myReview = useReviewsStore((s) => s.myReview);
  const isLoading = useReviewsStore((s) => s.isLoading);
  const fetchMyReview = useReviewsStore((s) => s.fetchMyReview);
  const upsertMyReview = useReviewsStore((s) => s.upsertMyReview);
  const deleteMyReview = useReviewsStore((s) => s.deleteMyReview);

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyReview();
  }, [fetchMyReview]);

  // Sync local form state with the loaded review (also re-syncs if the store
  // changes via realtime, e.g. the review is deleted in another session).
  useEffect(() => {
    const nextMessage = myReview?.message ?? '';
    setRating(myReview?.rating ?? 0);
    setMessage(nextMessage);
    setMessageLength(plainTextLength(nextMessage));
  }, [myReview]);

  const isEdit = myReview !== null;
  const isDirty =
    !isEdit
      ? rating > 0 || messageLength > 0
      : rating !== myReview.rating || message.trim() !== myReview.message.trim();
  const canSave =
    rating >= 1 &&
    rating <= 5 &&
    messageLength >= 1 &&
    messageLength <= MAX_MESSAGE &&
    isDirty &&
    !isSaving;

  const handleMessageChange = (html: string, plainText: string) => {
    setMessage(html);
    setMessageLength(plainText.trim().length);
  };

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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Voto</label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Messaggio{' '}
                <span className={`font-normal ${messageLength > MAX_MESSAGE ? 'text-red-500' : 'text-zinc-400'}`}>
                  ({messageLength}/{MAX_MESSAGE})
                </span>
              </label>
              <RichTextEditor
                value={message}
                onChange={handleMessageChange}
                placeholder="Cosa funziona, cosa miglioreresti, a chi consiglieresti Lume…"
                minHeight={220}
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
                  <Button variant="ghost" leadingIcon={Trash2} onClick={() => setShowDelete(true)}>
                    Elimina
                  </Button>
                )}
                <Button
                  variant="primary"
                  leadingIcon={Save}
                  loading={isSaving}
                  disabled={!canSave}
                  onClick={handleSave}
                >
                  {isSaving ? 'Salvataggio…' : isEdit ? 'Aggiorna' : 'Salva'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
