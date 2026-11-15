'use client';

import { Star, Wallet, CalendarDays } from 'lucide-react';
import type { Stars } from '@/lib/types/ClientRating';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

// ds-ignore: a read-only 1 to 5 star rating with a wallet or calendar icon; Tag, StatusDot, NumberBadge and DetailChip show a label, a state or a count, and StarRating is a large input
type Kind = 'money' | 'calendar';

interface ClientRatingBadgeProps {
  stars: Stars | null;
  kind: Kind;
}

export function ClientRatingBadge({ stars, kind }: ClientRatingBadgeProps) {
  const Icon = kind === 'money' ? Wallet : CalendarDays;

  if (stars === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--lume-text-muted)]">
        <Icon className="size-3.5" />
        <span className="text-xs leading-none">—</span>
      </span>
    );
  }

  // Wallet green, calendar blue: the colour tells the two ratings apart at a glance.
  const accent = kind === 'money' ? 'text-success-strong' : 'text-info-strong';
  const dim = 'text-edge';

  return (
    <Tooltip label={kind === 'money' ? `Spesa: ${stars}/5 stelle` : `Frequenza: ${stars}/5 stelle`}>
      <span className="inline-flex items-center gap-1">
        <Icon className={`size-3.5 ${accent}`} />
        <span className="inline-flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`size-3 ${i <= stars ? `${accent} fill-current` : dim}`}
            />
          ))}
        </span>
      </span>
    </Tooltip>
  );
}
