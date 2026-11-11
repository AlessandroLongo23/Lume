'use client';

import { useState, useRef, type ComponentProps } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Loader2, type LucideIcon } from 'lucide-react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { cn } from '@/lib/utils';
import { DURATION } from '@/lib/const/motion';
import { useSidebarCollapseContext, useSidebarForceExpanded } from './sidebarContext';

export type UserCardMenuItem =
  | { type: 'link'; label: string; href: string; icon?: LucideIcon }
  | { type: 'button'; label: string; onClick: () => void | Promise<void>; icon?: LucideIcon; danger?: boolean; loadingLabel?: string };

interface SidebarUserCardProps {
  name: string;
  role: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  menuItems: UserCardMenuItem[];
}

/** Collapsed sidebar: the menu cannot match the 56px trigger, so it has its own width. */
const COLLAPSED_MENU_WIDTH = 224;

function Spinner({ className, ...props }: ComponentProps<typeof Loader2>) {
  return <Loader2 {...props} className={cn(className, 'animate-spin')} />;
}

export function SidebarUserCard({ name, role, avatarInitials, avatarUrl, menuItems }: SidebarUserCardProps) {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;

  // Collapsed, the rail is too narrow for the menu: it opens to the right of it.
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(buttonRef, {
    panelMaxHeight: menuItems.length * 40 + 16,
    offset: effectiveCollapsed ? 20 : 8,
    placement: effectiveCollapsed ? 'right' : 'bottom',
  });

  const linkRefs = useRef<(HTMLElement | null)[]>([]);
  const nav = useListNavigation({
    count: menuItems.length,
    onPick: (i) => linkRefs.current[i]?.click(),
    onEscape: hide,
    listRef,
  });

  async function handleItem(item: UserCardMenuItem, idx: number) {
    if (item.type !== 'button') return;
    setBusyIndex(idx);
    try {
      await item.onClick();
    } finally {
      setBusyIndex(null);
      hide();
    }
  }

  return (
    <div className="relative">
      <button
        // ds-ignore: a sidebar rail row (avatar, name, role); the rail's hover glide paints its hover, where Button would paint its own fill and control height
        ref={buttonRef}
        type="button"
        onClick={() => { nav.setActive(-1); toggle(); }}
        onKeyDown={open ? nav.onKeyDown : undefined}
        // A row of the sidebar rail: its hover glide paints the hover (data-nav-row).
        data-nav-row=""
        className="relative w-full flex items-center justify-between rounded-md cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--lume-ring-focus)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utente"
      >
        <div className="flex items-center min-w-0">
          <span className="flex items-center justify-center w-10 h-10 shrink-0">
            {avatarUrl ? (
              <span className="relative w-8 h-8 rounded-full overflow-hidden shadow-[inset_0_0_0_1px_var(--lume-edge)]">
                <Image
                  src={avatarUrl}
                  alt={name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-active text-[var(--lume-text)] text-xs font-medium">
                {avatarInitials || '?'}
              </span>
            )}
          </span>
          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.span
                key="identity"
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                transition={{ duration: DURATION.base, ease: 'easeOut' }}
                className="flex flex-col items-start min-w-0 leading-tight overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-medium text-[var(--lume-text)] truncate max-w-35">{name}</span>
                <span className="text-xs text-[var(--lume-text-muted)] truncate max-w-35">{role}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {!effectiveCollapsed && (
            <motion.span
              key="chevron"
              initial={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 8, marginRight: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
              transition={{ duration: DURATION.base, ease: 'easeOut' }}
              className="shrink-0 overflow-hidden"
            >
              <ChevronDown className="w-4 h-4 text-[var(--lume-text-muted)]" strokeWidth={1.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              style={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                bottom: position.bottom,
                width: effectiveCollapsed ? COLLAPSED_MENU_WIDTH : position.width,
              }}
            >
              <ListBox ref={listRef} role="menu" aria-label="Menu utente" onKeyDown={nav.onKeyDown}>
                {menuItems.map((item, idx) => {
                  const setRef = (el: HTMLElement | null) => { linkRefs.current[idx] = el; };
                  if (item.type === 'link') {
                    const Icon = item.icon;
                    return (
                      <ListRow key={idx} asChild highlighted={nav.active === idx} onMouseEnter={() => nav.setActive(idx)}>
                        <Link ref={setRef} href={item.href} onClick={hide}>
                          {Icon && <Icon aria-hidden className="size-4 shrink-0 text-[var(--lume-text-muted)]" />}
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </Link>
                      </ListRow>
                    );
                  }
                  const isBusy = busyIndex === idx;
                  return (
                    <ListRow
                      key={idx}
                      ref={setRef}
                      icon={isBusy ? Spinner : item.icon}
                      destructive={item.danger}
                      disabled={isBusy}
                      highlighted={nav.active === idx}
                      onMouseEnter={() => nav.setActive(idx)}
                      onClick={() => handleItem(item, idx)}
                    >
                      {isBusy && item.loadingLabel ? item.loadingLabel : item.label}
                    </ListRow>
                  );
                })}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
