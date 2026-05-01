'use client';

import { Star, Wallet, CalendarDays } from 'lucide-react';
import type { Stars } from '@/lib/types/ClientRating';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

type Kind = 'money' | 'calendar';

interface ClientRatingBadgeProps {
  stars: Stars | null;
  kind: Kind;
  size?: 'sm' | 'md';
}

export function ClientRatingBadge({ stars, kind, size = 'sm' }: ClientRatingBadgeProps) {
  const Icon = kind === 'money' ? Wallet : CalendarDays;
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  const starClass = size === 'sm' ? 'size-3' : 'size-3.5';

  if (stars === null) {
    return (
      <span className="inline-flex items-center gap-1 text-zinc-400">
        <Icon className={iconClass} />
        <span className="text-xs">—</span>
      </span>
    );
  }

  const accent = kind === 'money' ? 'text-emerald-500' : 'text-sky-500';
  const dim = 'text-zinc-300 dark:text-zinc-600';

  return (
    <Tooltip label={kind === 'money' ? `Spesa: ${stars}/5 stelle` : `Frequenza: ${stars}/5 stelle`}>
      <span className="inline-flex items-center gap-1">
        <Icon className={`${iconClass} ${accent}`} />
        <span className="inline-flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`${starClass} ${i <= stars ? `${accent} fill-current` : dim}`}
            />
          ))}
        </span>
      </span>
    </Tooltip>
  );
}
