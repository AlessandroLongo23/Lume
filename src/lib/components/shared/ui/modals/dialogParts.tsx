'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { cn } from '@/lib/utils';

/**
 * The one dialog language shared by Modal (and so ConfirmDialog, AddModal,
 * DeleteModal) and the side panel: a raised surface with a float shadow ring (no CSS
 * border), a calm backdrop, a weight-500 title and a right-aligned footer under
 * a hairline. Enter is a 4px rise plus fade; reduced motion fades only.
 */

/** Backdrop: the overlay token at roughly half strength, so the page stays legible. */
export const DIALOG_BACKDROP =
  'bg-[color-mix(in_oklab,var(--lume-overlay)_55%,transparent)]';

/** The dialog card itself. Modal applies it; callers pass only the width. */
export const DIALOG_SURFACE =
  'rounded-xl bg-[var(--lume-surface-raised)] text-[var(--lume-text)] shadow-float';

export const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
  transition: { duration: DURATION.fast },
} as const;

export function dialogMotion(reduceMotion: boolean | null) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 },
    animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: {
      ...(reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }),
      transition: { duration: DURATION.fast, ease: EASE_OUT },
    },
    transition: { duration: DURATION.base, ease: EASE_OUT },
  };
}

interface DialogHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  titleId?: string;
  subtitleId?: string;
  onClose?: () => void;
  closeDisabled?: boolean;
  /** Hairline under the header, for dialogs whose body scrolls (forms). */
  divider?: boolean;
  className?: string;
}

export function DialogHeader({
  title,
  subtitle,
  titleId,
  subtitleId,
  onClose,
  closeDisabled,
  divider = false,
  className,
}: DialogHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 px-6 pt-5 shrink-0',
        divider ? 'pb-4 border-b border-line' : 'pb-2',
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h2
          id={titleId}
          className="text-lg font-medium tracking-tight leading-tight text-[var(--lume-text)] truncate"
        >
          {title}
        </h2>
        {subtitle && (
          <p id={subtitleId} className="text-sm text-[var(--lume-text-secondary)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Chiudi"
          onClick={onClose}
          disabled={closeDisabled}
          className="-mr-2 -mt-0.5 pointer-coarse:size-11"
        >
          <X />
        </Button>
      )}
    </div>
  );
}

interface DialogFooterProps {
  children: ReactNode;
  /** Content pinned to the start (left) of the footer: hints, a secondary link. */
  start?: ReactNode;
  className?: string;
}

export function DialogFooter({ children, start, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap items-center gap-3 px-6 py-4 border-t border-line shrink-0',
        start ? 'justify-between' : 'justify-end',
        className,
      )}
    >
      {start && <div className="min-w-0 text-sm text-[var(--lume-text-secondary)]">{start}</div>}
      <div className="flex flex-row flex-wrap items-center justify-end gap-2 ml-auto">{children}</div>
    </div>
  );
}
