'use client';

import { Copy, type LucideIcon } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';

interface ContactRowProps {
  icon: LucideIcon;
  value: string | null;
  emptyLabel: string;
  onCopy: (v: string) => void;
}

export function ContactRow({ icon: Icon, value, emptyLabel, onCopy }: ContactRowProps) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
        <Icon className="size-3.5" />
        <span className="italic text-xs">{emptyLabel}</span>
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
      <Icon className="size-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
      <span className="truncate">{value}</span>
      <Tooltip label="Copia negli appunti">
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Copia negli appunti"
          onClick={() => onCopy(value)}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <Copy />
        </Button>
      </Tooltip>
    </div>
  );
}
