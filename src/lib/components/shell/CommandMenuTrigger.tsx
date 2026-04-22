'use client';

import { Search } from 'lucide-react';

interface CommandMenuTriggerProps {
  onOpen: () => void;
  shortcutLabel?: string;
}

export function CommandMenuTrigger({ onOpen, shortcutLabel = '⌘K' }: CommandMenuTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Apri comandi"
      className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-500 min-w-[200px]"
    >
      <Search className="w-4 h-4 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-left truncate">Cerca…</span>
      <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 shrink-0">
        {shortcutLabel}
      </kbd>
    </button>
  );
}
