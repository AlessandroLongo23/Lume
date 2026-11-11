'use client';

import { Cake } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

interface BirthdayBadgeProps {
  daysLeft: number;
}

// ds-ignore: a brass cake icon beside a plain word with no fill; Tag and DetailChip add a grey pill and StatusDot a dot, so each would change the look
/** Upcoming birthday: a brass cake beside a neutral word, no tinted pill. */
export function BirthdayBadge({ daysLeft }: BirthdayBadgeProps) {
  const label =
    daysLeft === 0
      ? 'Compleanno oggi'
      : daysLeft === 1
        ? 'Compleanno domani'
        : `Compleanno fra ${daysLeft} giorni`;

  const short = daysLeft === 0 ? 'oggi' : daysLeft === 1 ? 'domani' : `fra ${daysLeft} giorni`;

  return (
    <Tooltip label={label}>
      <span
        className="inline-flex items-center gap-1 text-xs font-sans text-[var(--lume-text)] whitespace-nowrap"
        aria-label={label}
      >
        <Cake className="size-3.5 shrink-0 text-[var(--lume-brass-fg)]" aria-hidden />
        {short}
      </span>
    </Tooltip>
  );
}
