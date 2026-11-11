import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A small neutral label beside a name ("Test", "Tuo", "Nuovo"), with an
 * optional leading icon. Not a status (use StatusDot), not a count (use
 * NumberBadge); the larger chip beside a detail-page title is DetailChip.
 */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-5 px-1.5 rounded-sm text-2xs font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
        'bg-active text-[var(--lume-text-secondary)]',
        className,
      )}
    >
      {children}
    </span>
  );
}
