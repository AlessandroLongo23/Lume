'use client';

import { AlertCircle } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

type Variant = 'pill' | 'icon';

interface IncompleteContactBadgeProps {
  variant?: Variant;
}

const TOOLTIP_LABEL = 'Manca email o telefono. Completa quando il cliente torna in salone.';

export function IncompleteContactBadge({ variant = 'pill' }: IncompleteContactBadgeProps) {
  if (variant === 'icon') {
    return (
      <Tooltip label={TOOLTIP_LABEL}>
        <span
          className="inline-flex items-center justify-center"
          style={{ color: 'var(--lume-warning-fg)' }}
          aria-label={TOOLTIP_LABEL}
        >
          <AlertCircle className="size-4" />
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={TOOLTIP_LABEL}>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"
        style={{
          background: 'var(--lume-warning-bg)',
          color: 'var(--lume-warning-fg)',
          border: '1px solid var(--lume-warning-border)',
        }}
      >
        <AlertCircle className="size-3" />
        <span>Dati incompleti</span>
      </span>
    </Tooltip>
  );
}
