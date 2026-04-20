'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  ArrowLeft,
  Check,
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
  suggestion: 'text-indigo-600 dark:text-indigo-400',
  bug: 'text-red-600 dark:text-red-400',
  idea: 'text-amber-600 dark:text-amber-400',
};

const STATUS_DOT_CLASS: Record<FeedbackStatus, string> = {
  open: 'bg-zinc-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  closed: 'bg-zinc-500',
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
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="self-start flex flex-row items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Torna al feedback
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-8 xl:gap-10">
        {/* Main column */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* Header */}
          <header className="flex flex-col gap-3">
            <div className={`flex flex-row items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${typeColor}`}>
              <typeMeta.icon className="size-3.5" strokeWidth={2.25} />
              <span>{typeMeta.label}</span>
            </div>

            <h1 className="text-[32px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 break-words leading-[1.15]">
              {entry.title}
            </h1>

            <div className="flex flex-row items-center flex-wrap gap-x-2.5 gap-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex flex-row items-center gap-2">
                <div className="flex items-center justify-center size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {initials(entry.getAuthorName())}
                </div>
                <span className="text-zinc-700 dark:text-zinc-200">{entry.getAuthorName()}</span>
              </div>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span>{format(new Date(entry.created_at), 'd MMMM yyyy', { locale: it })}</span>
              {entry.completed_at && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Completato il {format(new Date(entry.completed_at), 'd MMM yyyy', { locale: it })}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Description */}
          <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">
            <MarkdownBody content={entry.description} />
            {entry.image_paths.length > 0 && <ImageGallery paths={entry.image_paths} />}
          </div>

          {/* Discussion */}
          <section className="flex flex-col gap-5 mt-2">
            <div className="flex flex-row items-baseline gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Discussione
              </h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
                {entry.comment_count} {entry.comment_count === 1 ? 'commento' : 'commenti'}
              </span>
            </div>

            <CommentList feedbackId={entry.id} currentUserId={currentUserId} />

            {canComment ? (
              <CommentForm onSubmit={handleAddComment} submitLabel="Commenta" />
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
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
                type="button"
                onClick={handleVote}
                disabled={!canVote}
                className={`flex flex-col items-center justify-center gap-1 py-4 rounded-xl border transition-colors shadow-sm ${
                  hasVoted
                    ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/80'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-primary/60'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ChevronUp className="size-4" strokeWidth={2.5} />
                <span className="text-2xl font-semibold tabular-nums leading-none">
                  {entry.upvote_count}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {hasVoted ? 'Votato' : 'Vota'}
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 shadow-sm">
                <ChevronUp className="size-4" strokeWidth={2.5} />
                <span className="text-2xl font-semibold tabular-nums leading-none">
                  {entry.upvote_count}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {entry.upvote_count === 1 ? 'voto' : 'voti'}
                </span>
              </div>
            )}
            <div className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 shadow-sm">
              <MessageSquare className="size-4" />
              <span className="text-2xl font-semibold tabular-nums leading-none">
                {entry.comment_count}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                {entry.comment_count === 1 ? 'commento' : 'commenti'}
              </span>
            </div>
          </div>

          {/* Dettagli card */}
          <Card>
            <CardHeader icon={Info} title="Dettagli" />
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              <DetailRow icon={Tag} label="Tipo">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta.badge}`}>
                  <typeMeta.icon className="size-3.5" strokeWidth={2} />
                  {typeMeta.label}
                </span>
              </DetailRow>
              <DetailRow icon={CircleDot} label="Stato">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.badge}`}>
                  <span className={`size-1.5 rounded-full ${STATUS_DOT_CLASS[entry.status]}`} />
                  {statusMeta.label}
                </span>
              </DetailRow>
              {entry.author_salon_name && (
                <DetailRow icon={Store} label="Salone">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 max-w-[10.5rem] truncate">
                    {entry.author_salon_name}
                  </span>
                </DetailRow>
              )}
              {isOwnEntry && (
                <DetailRow icon={User} label="Autore">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-300">
                    Tuo
                  </span>
                </DetailRow>
              )}
            </div>
            {(entry.linked_branch || entry.linked_pr_url) && (
              <div className="flex flex-col gap-1.5 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30">
                {entry.linked_branch && (
                  <div className="flex flex-row items-center gap-1.5 text-xs text-primary-hover dark:text-primary/80 min-w-0">
                    <GitBranch className="size-3.5 shrink-0" />
                    <code className="font-mono truncate">{entry.linked_branch}</code>
                  </div>
                )}
                {entry.linked_pr_url && (
                  <a
                    href={entry.linked_pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-row items-center gap-1.5 text-xs text-primary-hover dark:text-primary/80 hover:underline"
                  >
                    <ExternalLink className="size-3.5 shrink-0" />
                    Apri PR
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* Admin status editor */}
          {isAdmin && (
            <div className="flex flex-col rounded-xl border border-primary/25 bg-primary/[0.04] dark:bg-primary/[0.07] shadow-sm overflow-hidden">
              <div className="flex flex-row items-center gap-2 px-4 py-2.5 border-b border-primary/15">
                <div className="flex items-center justify-center rounded-md bg-primary/10 p-1">
                  <Settings2 className="size-3.5 text-primary-hover dark:text-primary/80" strokeWidth={2.25} />
                </div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-hover dark:text-primary/80">
                  Stato · Admin
                </h3>
              </div>
              <div className="flex flex-col gap-1 p-2">
                {STATUS_OPTIONS.map((s) => {
                  const isSelected = entry.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className={`group flex flex-row items-center justify-between gap-2 w-full px-2.5 py-2 rounded-lg text-sm transition-all ${
                        isSelected
                          ? 'bg-white dark:bg-zinc-900 text-primary-hover dark:text-primary/80 font-medium shadow-sm ring-1 ring-primary/30'
                          : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      <span className="flex flex-row items-center gap-2.5">
                        <span className={`size-2 rounded-full ${STATUS_DOT_CLASS[s]}`} />
                        {STATUS_META[s].label}
                      </span>
                      {isSelected && <Check className="size-3.5" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions card */}
          <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-row items-center gap-2.5 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
            >
              <Link2 className="size-4 text-zinc-500 dark:text-zinc-400" /> Copia link
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex flex-row items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-colors text-left border-t border-zinc-100 dark:border-zinc-800"
              >
                <Trash2 className="size-4" /> Elimina feedback
              </button>
            )}
          </div>
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
        >
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Stai per eliminare definitivamente{' '}
              <strong className="text-foreground">{entry.title}</strong>.
            </p>
            <p className="text-muted-foreground">
              Verranno rimossi anche tutti i commenti, i voti e le immagini allegate
              ({entry.comment_count} {entry.comment_count === 1 ? 'commento' : 'commenti'}
              {entry.upvote_count > 0 ? `, ${entry.upvote_count} ${entry.upvote_count === 1 ? 'voto' : 'voti'}` : ''}
              {entry.image_paths.length > 0 ? `, ${entry.image_paths.length} ${entry.image_paths.length === 1 ? 'immagine' : 'immagini'}` : ''}).
            </p>
          </div>
        </DeleteModal>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
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
    <div className="flex flex-row items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 p-1">
        <Icon className="size-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
      </div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">
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
      <div className="flex flex-row items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
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
