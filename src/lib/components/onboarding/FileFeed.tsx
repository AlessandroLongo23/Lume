'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, AlertCircle, Sparkles, X, Loader2 } from 'lucide-react';
import { FileIcon } from './fileIcons';
import { EASE_OUT, ENTITY_LABELS_PLURAL, type ChildState } from './onboardingTypes';

interface FileFeedProps {
  jobs: ChildState[];
}

/**
 * The per-file feed shown during the onboarding "magic" phase. Each row
 * morphs through the child's status — receiving, reading, classified,
 * committing, completed — so the operator never has to guess what is
 * happening to a particular file. Errors and concierge handoffs are named
 * inline; nothing is hidden behind a generic spinner.
 *
 * Note on liveness: `processed_rows` is updated by the orchestrator at the
 * end of each commit wave, so the per-file progress can stair-step rather
 * than glide. That's acceptable; users still see motion across rows.
 */
export function FileFeed({ jobs }: FileFeedProps) {
  const reduceMotion = useReducedMotion();

  const sortedJobs = useMemo(() => {
    const phaseRank: Record<string, number> = {
      uploading: 0,
      queued: 1,
      parsing: 2,
      awaiting_review: 3,
      committing: 4,
      partial_failure: 5,
      completed: 6,
      needs_concierge: 7,
      failed: 8,
      cancelled: 9,
    };
    return [...jobs].sort((a, b) => {
      const ra = phaseRank[a.status] ?? 99;
      const rb = phaseRank[b.status] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.source_filename.localeCompare(b.source_filename);
    });
  }, [jobs]);

  const completedCount = jobs.filter((c) => c.status === 'completed').length;

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="max-h-[28rem] overflow-y-auto divide-y divide-border">
        <AnimatePresence initial={false}>
          {sortedJobs.map((job, idx) => (
            <motion.div
              key={job.id}
              layout
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{
                duration: 0.24,
                ease: EASE_OUT,
                delay: reduceMotion ? 0 : Math.min(idx, 6) * 0.06,
              }}
            >
              <FeedRow job={job} reduceMotion={reduceMotion ?? false} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        <span>File pronti</span>
        <span className="tabular-nums text-foreground">
          {completedCount}/{jobs.length}
        </span>
      </div>
    </div>
  );
}

interface FeedRowProps {
  job: ChildState;
  reduceMotion: boolean;
}

function FeedRow({ job, reduceMotion }: FeedRowProps) {
  const subline = sublineFor(job);
  const entityLabel = job.entity ? ENTITY_LABELS_PLURAL[job.entity] ?? job.entity : null;
  const showRowProgress =
    job.status === 'committing' && job.total_rows && job.total_rows > 0;
  const progress = showRowProgress
    ? Math.min(1, (job.processed_rows ?? 0) / (job.total_rows ?? 1))
    : 0;
  const failureDetail = job.failure_reason ?? job.mapping_json?.classification?.reason ?? '';

  return (
    <div className="flex items-center gap-3 px-4 py-3" title={failureDetail || undefined}>
      <FileIcon filename={job.source_filename} className="size-[18px] shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm text-foreground">{job.source_filename}</span>
          {job.source_sheet_name && (
            <span className="truncate text-xs text-muted-foreground">· {job.source_sheet_name}</span>
          )}
        </div>
        <div className="mt-0.5 h-4 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={job.status}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="block text-xs text-muted-foreground"
            >
              {subline}
            </motion.span>
          </AnimatePresence>
        </div>
        {showRowProgress && (
          <div className="mt-2 h-px overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full origin-left bg-primary"
              initial={false}
              animate={{ scaleX: progress }}
              transition={{ duration: 0.32, ease: EASE_OUT }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {entityLabel && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {entityLabel}
          </span>
        )}
        <StatusIcon status={job.status} reduceMotion={reduceMotion} />
      </div>
    </div>
  );
}

function StatusIcon({ status, reduceMotion }: { status: string; reduceMotion: boolean }) {
  const iconClass = 'size-[14px] shrink-0';
  switch (status) {
    case 'completed':
      return <Check className={`${iconClass} text-success`} strokeWidth={2.5} />;
    case 'partial_failure':
      return <AlertCircle className={`${iconClass} text-warning`} />;
    case 'needs_concierge':
      return <Sparkles className={`${iconClass} text-primary`} strokeWidth={2.25} />;
    case 'failed':
      return <X className={`${iconClass} text-destructive`} strokeWidth={2.5} />;
    case 'cancelled':
      return <X className={`${iconClass} text-muted-foreground`} />;
    default:
      return reduceMotion ? (
        <Loader2 className={`${iconClass} text-muted-foreground`} />
      ) : (
        <Loader2 className={`${iconClass} animate-spin text-muted-foreground`} />
      );
  }
}

function sublineFor(job: ChildState): string {
  const total = job.total_rows ?? 0;
  const processed = job.processed_rows ?? 0;
  const entityLabel = job.entity ? ENTITY_LABELS_PLURAL[job.entity] ?? job.entity : 'righe';
  switch (job.status) {
    case 'uploading':
      return 'Sto ricevendo…';
    case 'queued':
    case 'parsing':
      return 'Sto leggendo…';
    case 'awaiting_review':
      if (total > 0 && job.auto_commit_eligible) return `Ho trovato ${total.toLocaleString('it-IT')} ${entityLabel}.`;
      if (total > 0) return `Vuoi controllare? ${total.toLocaleString('it-IT')} righe da rivedere.`;
      return 'Pronto da rivedere.';
    case 'committing':
      if (total > 0) return `Importo ${processed.toLocaleString('it-IT')} di ${total.toLocaleString('it-IT')} ${entityLabel}…`;
      return 'Sto importando…';
    case 'completed':
      if (total > 0) return `Importati ${total.toLocaleString('it-IT')} ${entityLabel}.`;
      return 'Importazione completata.';
    case 'partial_failure':
      if (total > 0) return `Importati ${processed.toLocaleString('it-IT')} su ${total.toLocaleString('it-IT')} ${entityLabel}. Alcuni saltati.`;
      return 'Importazione parziale.';
    case 'needs_concierge':
      return 'Il team Lume se ne occupa.';
    case 'failed':
      return job.failure_reason ?? 'Non sono riuscito a leggere questo file.';
    case 'cancelled':
      return 'Saltato.';
    default:
      return 'In attesa…';
  }
}
