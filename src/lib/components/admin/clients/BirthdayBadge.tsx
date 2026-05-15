'use client';

import { Cake } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

interface BirthdayBadgeProps {
  daysLeft: number;
}

export function BirthdayBadge({ daysLeft }: BirthdayBadgeProps) {
  const label =
    daysLeft === 0
      ? 'Compleanno oggi'
      : daysLeft === 1
        ? 'Compleanno domani'
        : `Compleanno fra ${daysLeft} giorni`;

  return (
    <Tooltip label={label}>
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium tabular-nums"
        style={{
          background: 'var(--lume-warning-bg)',
          color: 'var(--lume-warning-fg)',
          border: '1px solid var(--lume-warning-border)',
        }}
        aria-label={label}
      >
        <Cake className="size-3" />
        {daysLeft === 0 ? 'oggi' : `${daysLeft}g`}
      </span>
    </Tooltip>
  );
}
