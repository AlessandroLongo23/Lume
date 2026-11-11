'use client';

import { Copy, type LucideIcon } from 'lucide-react';
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
      <div className="flex items-center gap-2 text-[var(--lume-text-muted)]">
        <Icon className="size-3.5" aria-hidden />
        <span className="text-xs">{emptyLabel}</span>
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 text-sm text-[var(--lume-text)]">
      <Icon className="size-3.5 text-[var(--lume-text-muted)] shrink-0" aria-hidden />
      <span className="truncate">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Copia negli appunti"
        onClick={() => onCopy(value)}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 pointer-coarse:size-11 transition-opacity"
      >
        <Copy />
      </Button>
    </div>
  );
}
