'use client';

import { Search } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';

interface CommandMenuTriggerProps {
  onOpen: () => void;
  shortcutLabel?: string;
}

export function CommandMenuTrigger({ onOpen, shortcutLabel = '⌘K' }: CommandMenuTriggerProps) {
  return (
    <Button
      variant="secondary"
      size="md"
      leadingIcon={Search}
      onClick={onOpen}
      aria-label="Apri comandi"
      className="hidden sm:flex min-w-[200px] text-[var(--lume-text-muted)] justify-start"
    >
      <span className="flex-1 text-left truncate">Cerca…</span>
      <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 shrink-0">
        {shortcutLabel}
      </kbd>
    </Button>
  );
}
