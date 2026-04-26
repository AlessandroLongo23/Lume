'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip } from '@base-ui/react/tooltip';
import { useSidebarCollapseContext } from './sidebarContext';
import { sidebarToggleLabel } from './keyboardShortcuts';

const HINT_STORAGE_KEY = 'lume-sidebar-shortcut-hint-shown';
export const SIDEBAR_HINT_EVENT = 'lume:sidebar-hint';

/**
 * Subtle edge-pinned toggle. Rendered by AppShell just outside the sidebar's
 * right border. Appears on sidebar hover.
 */
export function SidebarEdgeToggle() {
  const { collapsed, toggle } = useSidebarCollapseContext();

  function handleClick() {
    toggle();
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(HINT_STORAGE_KEY) === '1') return;
    window.localStorage.setItem(HINT_STORAGE_KEY, '1');
    window.dispatchEvent(new CustomEvent(SIDEBAR_HINT_EVENT));
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={400}
        type="button"
        onClick={handleClick}
        aria-label={collapsed ? 'Espandi menu' : 'Comprimi menu'}
        className="hidden md:flex items-center justify-center w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" strokeWidth={2} />
        ) : (
          <ChevronLeft className="w-3 h-3" strokeWidth={2} />
        )}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={8}>
          <Tooltip.Popup className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 shadow-md">
            <span>{collapsed ? 'Espandi menu' : 'Comprimi menu'}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500">
              {sidebarToggleLabel()}
            </kbd>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
