'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bot, Pencil, Trash2 } from 'lucide-react';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { useFeedbackCommentsStore } from '@/lib/stores/feedbackComments';
import type { FeedbackComment } from '@/lib/types/FeedbackComment';
import { MarkdownBody } from './MarkdownBody';
import { ImageGallery } from './ImageGallery';
import { CommentForm } from './CommentForm';

interface CommentCardProps {
  comment: FeedbackComment;
  currentUserId: string | null;
}

export function CommentCard({ comment, currentUserId }: CommentCardProps) {
  const update = useFeedbackCommentsStore((s) => s.update);
  const remove = useFeedbackCommentsStore((s) => s.remove);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwn = currentUserId !== null && comment.author_id === currentUserId;
  const canEdit = isOwn && comment.isEditable;
  const canDelete = isOwn;
  const isAgent = comment.author_role === 'admin'; // Placeholder: treat admin-authored comments as "system/agent" for now.

  const wasEdited = new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 1000;

  const handleSaveEdit = async (data: { body: string; image_paths: string[] }) => {
    try {
      await update(comment.id, data);
      messagePopup.getState().success('Commento aggiornato');
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    }
  };

  const performDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await remove(comment.id);
      messagePopup.getState().success('Commento eliminato');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <CommentForm
          initialBody={comment.body}
          initialImagePaths={comment.image_paths}
          submitLabel="Salva"
          onSubmit={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
          placeholder="Modifica il commento"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3 p-4 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800/50">
      <div className={`flex shrink-0 items-center justify-center size-9 rounded-full text-xs font-semibold ${
        isAgent
          ? 'bg-primary/10 text-primary-hover dark:text-primary/70'
          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
      }`}>
        {isAgent ? <Bot className="size-4" /> : initials(comment.getAuthorName())}
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex flex-row items-center flex-wrap gap-2 text-xs">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {comment.getAuthorName()}
          </span>
          {isAgent && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary-hover dark:text-primary/70">
              <Bot className="size-3" /> Team Lume
            </span>
          )}
          {comment.author_salon_name && !isAgent && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {comment.author_salon_name}
            </span>
          )}
          <span className="text-zinc-400">·</span>
          <Tooltip label={new Date(comment.created_at).toLocaleString('it-IT')}>
            <span className="text-zinc-500 dark:text-zinc-400">
              {formatDistanceToNow(new Date(comment.created_at), { locale: it, addSuffix: true })}
            </span>
          </Tooltip>
          {wasEdited && (
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">(modificato)</span>
          )}

          {(canEdit || canDelete) && (
            <div className="ml-auto flex flex-row items-center gap-1">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Pencil className="size-3" /> Modifica
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="size-3" /> Elimina
                </button>
              )}
            </div>
          )}
        </div>

        <MarkdownBody content={comment.body} />

        {comment.image_paths.length > 0 && (
          <ImageGallery paths={comment.image_paths} />
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { void performDelete(); }}
        title="Eliminare il commento?"
        description="Il commento verrà rimosso definitivamente."
        confirmLabel="Elimina"
        tone="destructive"
        icon={Trash2}
      />
    </div>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
