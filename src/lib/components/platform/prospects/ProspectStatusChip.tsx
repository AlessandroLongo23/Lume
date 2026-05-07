'use client';

import { cn } from '@/lib/utils';
import { STATUS_LABEL, STATUS_TONE, type ProspectStatus } from '@/lib/types/Prospect';

type Tone = (typeof STATUS_TONE)[ProspectStatus];

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground border-border',
  muted:   'bg-muted/60 text-muted-foreground border-border',
  warning: 'bg-[var(--lume-warning-bg)] text-[var(--lume-warning-fg)] border-[var(--lume-warning-border)]',
  danger:  'bg-[var(--lume-danger-bg)]  text-[var(--lume-danger-fg)]  border-[var(--lume-danger-border)]',
  success: 'bg-[var(--lume-success-bg)] text-[var(--lume-success-fg)] border-[var(--lume-success-border)]',
  accent:  'bg-[var(--lume-accent-light)] text-[var(--lume-accent-dark)] border-[var(--lume-accent-light)]',
};

interface ProspectStatusChipProps {
  status: ProspectStatus;
  size?:  'xs' | 'sm';
  className?: string;
}

export function ProspectStatusChip({ status, size = 'sm', className }: ProspectStatusChipProps) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
        size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5',
        TONE_CLASS[tone],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
