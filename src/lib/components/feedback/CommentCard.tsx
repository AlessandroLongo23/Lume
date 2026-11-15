'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bot, Pencil, Trash2 } from 'lucide-react';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
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
    <div className="surface-card flex flex-row gap-3 p-4">
      <div className={`flex shrink-0 items-center justify-center size-9 rounded-full text-xs font-medium ${
        isAgent
          ? 'bg-active text-[var(--lume-text)]'
          : 'bg-strong text-[var(--lume-text-secondary)]'
      }`}>
        {isAgent ? <Bot className="size-4" /> : initials(comment.getAuthorName())}
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex flex-row items-center flex-wrap gap-2 text-xs">
          <span className="font-medium text-[var(--lume-text)]">
            {comment.getAuthorName()}
          </span>
          {isAgent && (
            <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded-md text-2xs font-medium bg-active text-[var(--lume-text)]">
              <Bot className="size-3" /> Team Lume
            </span>
          )}
          {comment.author_salon_name && !isAgent && (
            <span className="text-[var(--lume-text-secondary)]">
              {comment.author_salon_name}
            </span>
          )}
          <span className="text-[var(--lume-text-muted)]">·</span>
          <Tooltip label={new Date(comment.created_at).toLocaleString('it-IT')}>
            <span className="text-[var(--lume-text-secondary)]">
              {formatDistanceToNow(new Date(comment.created_at), { locale: it, addSuffix: true })}
            </span>
          </Tooltip>
          {wasEdited && (
            <span className="text-[var(--lume-text-muted)] text-2xs">(modificato)</span>
          )}

          {(canEdit || canDelete) && (
            <div className="ml-auto flex flex-row items-center gap-1">
              {canEdit && (
                <Button variant="ghost" size="sm" leadingIcon={Pencil} onClick={() => setIsEditing(true)}>
                  Modifica
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost-destructive"
                  size="sm"
                  leadingIcon={Trash2}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Elimina
                </Button>
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
