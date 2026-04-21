'use client';

import { Search } from 'lucide-react';
import { useSidebarCollapseContext, useSidebarForceExpanded } from './sidebarContext';

interface CommandMenuTriggerProps {
  variant: 'sidebar' | 'topbar';
  onOpen: () => void;
  shortcutLabel?: string;
}

export function CommandMenuTrigger({ variant, onOpen, shortcutLabel = '⌘K' }: CommandMenuTriggerProps) {
  if (variant === 'sidebar') {
    return <SidebarTrigger onOpen={onOpen} shortcutLabel={shortcutLabel} />;
  }
  return <TopbarTrigger onOpen={onOpen} shortcutLabel={shortcutLabel} />;
}

function SidebarTrigger({ onOpen, shortcutLabel }: { onOpen: () => void; shortcutLabel: string }) {
  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;

  if (effectiveCollapsed) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Apri comandi"
        title={`Cerca o crea… (${shortcutLabel})`}
        className="flex items-center justify-center w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <Search className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Apri comandi"
      className="flex items-center gap-2 w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-500"
    >
      <Search className="w-4 h-4 shrink-0" strokeWidth={1.5} />
      <span className="flex-1 text-left truncate">Cerca o crea…</span>
      <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 shrink-0">
        {shortcutLabel}
      </kbd>
    </button>
  );
}

function TopbarTrigger({ onOpen, shortcutLabel }: { onOpen: () => void; shortcutLabel: string }) {
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
