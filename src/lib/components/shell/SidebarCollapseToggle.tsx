'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
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

  const label = collapsed ? 'Espandi menu' : 'Comprimi menu';

  return (
    <Tooltip label={label} shortcut={sidebarToggleLabel()} side="right">
      <button
        // ds-ignore: a 20px round chip pinned to the sidebar edge with an enlarged invisible hit area; Button's smallest size is a 32px rounded square
        type="button"
        onClick={handleClick}
        aria-label={label}
        className={[
          // A floating chip on the sidebar edge: the float surface, made round.
          'surface-float hidden md:flex items-center justify-center size-5 rounded-full text-[var(--lume-text-muted)]',
          'hover:text-[var(--lume-text)] transition-colors duration-[var(--duration-fast)]',
          "relative before:absolute before:-inset-2 before:content-['']",
        ].join(' ')}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" strokeWidth={2} />
        ) : (
          <ChevronLeft className="w-3 h-3" strokeWidth={2} />
        )}
      </button>
    </Tooltip>
  );
}
