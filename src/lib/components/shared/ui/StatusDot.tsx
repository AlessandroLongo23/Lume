import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'muted' | 'accent';

/**
 * The ink of each tone, as a text colour. Marks paint with `bg-current` so one
 * map serves dots, chip icons and bar fills (DetailChip, StatTile, ProgressBar).
 */
export const STATUS_TONE_INK: Record<StatusTone, string> = {
  success: 'text-success-strong',
  warning: 'text-warning-strong',
  danger: 'text-danger-strong',
  info: 'text-info-strong',
  neutral: 'text-[var(--lume-text-muted)]',
  // Inactive / archived: a faint dot, for a second grey step.
  muted: 'text-[var(--lume-edge-hover)]',
  accent: 'text-[var(--lume-accent)]',
};

/** State shown as a coloured dot beside a neutral word. */
export function StatusDot({
  tone,
  children,
  className = '',
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[var(--lume-text)] whitespace-nowrap', className)}>
      <span className={`size-1.5 shrink-0 rounded-full bg-current ${STATUS_TONE_INK[tone]}`} aria-hidden />
      {children}
    </span>
  );
}
