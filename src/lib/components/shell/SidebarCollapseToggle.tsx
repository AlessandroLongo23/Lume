'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebarCollapseContext } from './sidebarContext';

/**
 * Subtle edge-pinned toggle. Rendered by AppShell just outside the sidebar's
 * right border. Appears on sidebar hover.
 */
export function SidebarEdgeToggle() {
  const { collapsed, toggle } = useSidebarCollapseContext();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? 'Espandi menu' : 'Comprimi menu'}
      className="hidden md:flex items-center justify-center w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm transition-colors"
    >
      {collapsed ? (
        <ChevronRight className="w-3 h-3" strokeWidth={2} />
      ) : (
        <ChevronLeft className="w-3 h-3" strokeWidth={2} />
      )}
    </button>
  );
}
