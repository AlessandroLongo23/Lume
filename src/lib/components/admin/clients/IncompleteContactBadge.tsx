'use client';

import { AlertCircle } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';

interface IncompleteContactBadgeProps {
  /** `dot` beside a word (cards), `icon` alone (table cells). */
  variant: 'dot' | 'icon';
}

const TOOLTIP_LABEL = 'Manca email o telefono. Completa quando il cliente torna in salone.';

export function IncompleteContactBadge({ variant }: IncompleteContactBadgeProps) {
  if (variant === 'icon') {
    return (
      <Tooltip label={TOOLTIP_LABEL}>
        <span
          className="inline-flex items-center justify-center text-warning-strong"
          aria-label={TOOLTIP_LABEL}
        >
          <AlertCircle className="size-3.5" />
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={TOOLTIP_LABEL}>
      <span className="inline-flex">
        <StatusDot tone="warning" className="text-xs">Dati incompleti</StatusDot>
      </span>
    </Tooltip>
  );
}
