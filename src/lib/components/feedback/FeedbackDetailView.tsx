'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  ArrowLeft,
  ChevronUp,
  CircleDot,
  ExternalLink,
  GitBranch,
  Info,
  Link2,
  MessageSquare,
  Settings2,
  Store,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { Tag as LabelTag } from '@/lib/components/shared/ui/Tag';
import { ListBox, ListRow, ListSeparator } from '@/lib/components/shared/ui/list/ListBox';
import { cn } from '@/lib/utils';
import { useFeedbackStore } from '@/lib/stores/feedback';
import { useFeedbackCommentsStore } from '@/lib/stores/feedbackComments';
import type { FeedbackEntry, FeedbackStatus, FeedbackType } from '@/lib/types/FeedbackEntry';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { ImageGallery } from './ImageGallery';
import { MarkdownBody } from './MarkdownBody';
import { STATUS_META, TYPE_META } from './feedback-meta';

interface FeedbackDetailViewProps {
  entry: FeedbackEntry;
  isAdmin: boolean;
  backHref: string;
  allowUpvote?: boolean;
}

const STATUS_OPTIONS: FeedbackStatus[] = ['open', 'in_progress', 'completed', 'closed'];

const TYPE_TEXT_COLOR: Record<FeedbackType, string> = {
  suggestion: 'text-info-strong',
  bug: 'text-danger-strong',
  idea: 'text-warning-strong',
};

export function FeedbackDetailView({ entry, isAdmin, backHref, allowUpvote = true }: FeedbackDetailViewProps) {
  const router = useRouter();

  const hasVoted = useFeedbackStore((s) => s.myUpvoteIds.has(entry.id));
  const toggleUpvote = useFeedbackStore((s) => s.toggleUpvote);
  const updateEntry = useFeedbackStore((s) => s.updateEntry);
  const deleteEntry = useFeedbackStore((s) => s.deleteEntry);

  const addComment = useFeedbackCommentsStore((s) => s.add);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const typeMeta = TYPE_META[entry.type];
  const statusMeta = STATUS_META[entry.status];
  const isOwnEntry = currentUserId !== null && entry.author_id === currentUserId;
  const canVote = allowUpvote && (!isOwnEntry || isAdmin);
  const canDelete = isAdmin || (isOwnEntry && entry.status === 'open');
  const canComment = currentUserId !== null;

  const handleVote = async () => {
    if (!canVote) return;
    try {
      await toggleUpvote(entry.id);
    } catch (err) {
      messagePopup.getState().error('Voto non registrato: ' + msgOf(err));
    }
  };

  const handleStatusChange = async (next: FeedbackStatus) => {
    if (next === entry.status) return;
    try {
      await updateEntry(entry.id, { status: next });
      messagePopup.getState().success('Stato aggiornato');
    } catch (err) {
      messagePopup.getState().error('Errore: ' + msgOf(err));
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry(entry.id);
      messagePopup.getState().success('Feedback eliminato');
      setShowDeleteModal(false);
      router.push(backHref);
    } catch (err) {
      messagePopup.getState().error('Errore durante l\'eliminazione: ' + msgOf(err));
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      messagePopup.getState().success('Link copiato');
    } catch {
      messagePopup.getState().error('Impossibile copiare il link');
    }
  };

  const handleAddComment = async (data: { body: string; image_paths: string[] }) => {
    try {
      await addComment(entry.id, data);
      messagePopup.getState().success('Commento pubblicato');
    } catch (err) {
      messagePopup.getState().error('Errore: ' + msgOf(err));
      throw err;
    }
  };

  const typeColor = TYPE_TEXT_COLOR[entry.type];

  return (
    <div className="flex flex-col gap-6 w-full">
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={ArrowLeft}
        onClick={() => router.push(backHref)}
        className="self-start"
      >
        Torna al feedback
      </Button>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-8 xl:gap-10">
        {/* Main column */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* Header */}
          <header className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-1.5 text-xs font-medium text-[var(--lume-text-secondary)]">
              <typeMeta.icon className={`size-3.5 ${typeColor}`} strokeWidth={2.25} />
              <span>{typeMeta.label}</span>
            </div>

            <PageHeader title={entry.title} wrap />

            <div className="flex flex-row items-center flex-wrap gap-x-2.5 gap-y-1.5 text-sm text-[var(--lume-text-secondary)]">
              <div className="flex flex-row items-center gap-2">
                <div className="flex items-center justify-center size-6 rounded-full bg-active text-2xs font-medium text-[var(--lume-text-secondary)]">
                  {initials(entry.getAuthorName())}
                </div>
                <span className="text-[var(--lume-text)]">{entry.getAuthorName()}</span>
              </div>
              <span className="text-[var(--lume-text-muted)]">·</span>
              <span>{format(new Date(entry.created_at), 'd MMMM yyyy', { locale: it })}</span>
              {entry.completed_at && (
                <>
                  <span className="text-[var(--lume-text-muted)]">·</span>
                  <span>
                    Completato il {format(new Date(entry.completed_at), 'd MMM yyyy', { locale: it })}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Description */}
          <div className="flex flex-col gap-5 text-[var(--lume-text)]">
            <MarkdownBody content={entry.description} />
            {entry.image_paths.length > 0 && <ImageGallery paths={entry.image_paths} />}
          </div>

          {/* Discussion */}
          <section className="flex flex-col gap-5 mt-2">
            <div className="flex flex-row items-baseline gap-3 pb-3 border-b border-line">
              <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">
                Discussione
              </h2>
              <span className="text-sm text-[var(--lume-text-secondary)] tabular-nums">
                {entry.comment_count} {entry.comment_count === 1 ? 'commento' : 'commenti'}
              </span>
            </div>

            <CommentList feedbackId={entry.id} currentUserId={currentUserId} />

            {canComment ? (
              <CommentForm onSubmit={handleAddComment} submitLabel="Commenta" />
            ) : (
              <p className="text-sm text-[var(--lume-text-secondary)] italic">
                Accedi per partecipare alla discussione.
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
          {/* Activity tiles */}
          <div className="grid grid-cols-2 gap-3">
            {allowUpvote ? (
              <button
                // ds-ignore: vote tile, a clickable surface-card stat (arrow, count, label) the size of its neighbour tile; Button is a fixed-height control
                type="button"
                onClick={handleVote}
                disabled={!canVote}
                aria-pressed={hasVoted}
                className={cn(
                  'surface-card card-interactive flex flex-col items-center justify-center gap-1 py-4 text-[var(--lume-text)] disabled:opacity-50 disabled:cursor-not-allowed',
                  hasVoted && 'selected',
                )}
              >
                <ChevronUp className="size-4" strokeWidth={2.5} />
                <span className="text-2xl font-medium tabular-nums leading-none">
                  {entry.upvote_count}
                </span>
                <span className="text-xs text-[var(--lume-text-secondary)]">
                  {hasVoted ? 'Votato' : 'Vota'}
                </span>
              </button>
            ) : (
              <div className="surface-card flex flex-col items-center justify-center gap-1 py-4 text-[var(--lume-text)]">
                <ChevronUp className="size-4" strokeWidth={2.5} />
                <span className="text-2xl font-medium tabular-nums leading-none">
                  {entry.upvote_count}
                </span>
                <span className="text-xs text-[var(--lume-text-secondary)]">
                  {entry.upvote_count === 1 ? 'voto' : 'voti'}
                </span>
              </div>
            )}
            <div className="surface-card flex flex-col items-center justify-center gap-1 py-4 text-[var(--lume-text)]">
              <MessageSquare className="size-4" />
              <span className="text-2xl font-medium tabular-nums leading-none">
                {entry.comment_count}
              </span>
              <span className="text-xs text-[var(--lume-text-secondary)]">
                {entry.comment_count === 1 ? 'commento' : 'commenti'}
              </span>
            </div>
          </div>

          {/* Dettagli card */}
          <Card>
            <CardHeader icon={Info} title="Dettagli" />
            <div className="flex flex-col divide-y divide-line">
              <DetailRow icon={Tag} label="Tipo">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lume-text-secondary)]">
                  <typeMeta.icon className={`size-3.5 ${typeMeta.badge}`} strokeWidth={2} />
                  {typeMeta.label}
                </span>
              </DetailRow>
              <DetailRow icon={CircleDot} label="Stato">
                <StatusDot tone={statusMeta.tone} className="text-xs font-medium">
                  {statusMeta.label}
                </StatusDot>
              </DetailRow>
              {entry.author_salon_name && (
                <DetailRow icon={Store} label="Salone">
                  <span className="text-xs font-medium text-[var(--lume-text)] max-w-42 truncate">
                    {entry.author_salon_name}
                  </span>
                </DetailRow>
              )}
              {isOwnEntry && (
                <DetailRow icon={User} label="Autore">
                  <LabelTag>Tuo</LabelTag>
                </DetailRow>
              )}
            </div>
            {(entry.linked_branch || entry.linked_pr_url) && (
              <div className="flex flex-col gap-1.5 px-4 py-3 border-t border-line bg-hover">
                {entry.linked_branch && (
                  <div className="flex flex-row items-center gap-1.5 text-xs text-[var(--lume-text-secondary)] min-w-0">
                    <GitBranch className="size-3.5 shrink-0" />
                    <code className="font-mono truncate">{entry.linked_branch}</code>
                  </div>
                )}
                {entry.linked_pr_url && (
                  <TextLink
                    href={entry.linked_pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-row items-center gap-1.5 self-start text-xs font-normal"
                  >
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    Apri PR
                  </TextLink>
                )}
              </div>
            )}
          </Card>

          {/* Admin status editor */}
          {isAdmin && (
            <Card>
              <CardHeader icon={Settings2} title="Stato · Admin" />
              <ListBox role="listbox" aria-label="Stato del feedback" className="p-2">
                {STATUS_OPTIONS.map((s) => (
                  <ListRow
                    key={s}
                    selected={entry.status === s}
                    check
                    onClick={() => handleStatusChange(s)}
                  >
                    <StatusDot tone={STATUS_META[s].tone}>{STATUS_META[s].label}</StatusDot>
                  </ListRow>
                ))}
              </ListBox>
            </Card>
          )}

          {/* Actions card */}
          <Card>
            <ListBox role="list" aria-label="Azioni">
              <ListRow icon={Link2} onClick={handleCopyLink}>Copia link</ListRow>
              {canDelete && (
                <>
                  <ListSeparator />
                  <ListRow icon={Trash2} destructive onClick={() => setShowDeleteModal(true)}>
                    Elimina feedback
                  </ListRow>
                </>
              )}
            </ListBox>
          </Card>
        </aside>
      </div>

      {canDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            if (!isDeleting) setShowDeleteModal(false);
          }}
          onConfirm={handleConfirmDelete}
          title="Elimina feedback"
          subtitle="Questa azione è irreversibile"
          confirmText={isDeleting ? 'Eliminazione…' : 'Elimina'}
          busy={isDeleting}
          warning={
            <>
              <p>
                Stai per eliminare definitivamente{' '}
                <strong className="font-medium text-[var(--lume-text)]">{entry.title}</strong>.
              </p>
              <p className="mt-2">
                Verranno rimossi anche tutti i commenti, i voti e le immagini allegate
                ({entry.comment_count} {entry.comment_count === 1 ? 'commento' : 'commenti'}
                {entry.upvote_count > 0 ? `, ${entry.upvote_count} ${entry.upvote_count === 1 ? 'voto' : 'voti'}` : ''}
                {entry.image_paths.length > 0 ? `, ${entry.image_paths.length} ${entry.image_paths.length === 1 ? 'immagine' : 'immagini'}` : ''}).
              </p>
            </>
          }
        />
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-card flex flex-col overflow-hidden">
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
}) {
  return (
    <div className="flex flex-row items-center gap-2 px-4 py-2.5 border-b border-line">
      <Icon className="size-3.5 text-[var(--lume-text-muted)]" strokeWidth={2.25} />
      <h3 className="text-xs font-medium text-[var(--lume-text)]">
        {title}
      </h3>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-2 px-4 py-2.5">
      <div className="flex flex-row items-center gap-2 text-xs text-[var(--lume-text-secondary)]">
        <Icon className="size-3.5" strokeWidth={2} />
        <span>{label}</span>
      </div>
      <div className="flex items-center min-w-0">{children}</div>
    </div>
  );
}

function msgOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Errore sconosciuto';
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
