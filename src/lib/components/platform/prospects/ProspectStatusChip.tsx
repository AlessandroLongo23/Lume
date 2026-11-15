import { cn } from '@/lib/utils';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { STATUS_LABEL, STATUS_TONE, type ProspectStatus } from '@/lib/types/Prospect';

interface ProspectStatusChipProps {
  status: ProspectStatus;
  size?:  'xs' | 'sm';
  className?: string;
}

/** A prospect's status as the shared dot + word (StatusDot). */
export function ProspectStatusChip({ status, size = 'sm', className }: ProspectStatusChipProps) {
  return (
    <StatusDot
      tone={STATUS_TONE[status]}
      className={cn('font-medium', size === 'xs' ? 'text-2xs' : 'text-xs', className)}
    >
      {STATUS_LABEL[status]}
    </StatusDot>
  );
}
