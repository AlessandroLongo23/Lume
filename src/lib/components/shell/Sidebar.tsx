'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useRef } from 'react';
import { DURATION, SPRING } from '@/lib/const/motion';
import { useHoverGlide } from '@/lib/hooks/useHoverGlide';
import type { LucideIcon } from 'lucide-react';
import { useSidebarCollapseContext, useMobileMenu, useSidebarForceExpanded } from './sidebarContext';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { useScrollEdges, scrollEdgeMask } from '@/lib/hooks/useScrollEdges';

export type SidebarNavItem = {
  name: string;
  url: string;          // absolute or segment — fully rendered href
  icon: LucideIcon;
  matcher?: (pathname: string) => boolean;
  dataTour?: string;    // stable anchor for interactive tours (NextStep selector)
};

export type SidebarNavGroup = {
  title?: string;
  items: SidebarNavItem[];
};

interface SidebarProps {
  identity?: React.ReactNode;
  navGroups: SidebarNavGroup[];
  pinnedLinks?: SidebarNavItem[];
  userCard?: React.ReactNode;
}

function defaultMatch(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

function NavLink({ item, collapsed, onNavigate }: { item: SidebarNavItem; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = item.matcher ? item.matcher(pathname) : defaultMatch(pathname, item.url);
  const Icon = item.icon;

  return (
    <Tooltip label={collapsed ? item.name : undefined} side="right">
      <Link
        href={item.url}
        onClick={onNavigate}
        data-tour={item.dataTour}
        data-nav-row=""
        aria-current={isActive ? 'page' : undefined}
        // Selected is a neutral fill with full-strength text and a heavier
        // icon stroke: indigo stays reserved for actions. Hover has no fill of
        // its own: the sidebar's hover glide travels to the row instead.
        className={`relative flex items-center text-sm rounded-md transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--lume-ring-focus)] ${
          isActive
            ? 'text-[var(--lume-text)]'
            : 'text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] hover:[&_svg]:[stroke-width:2]'
        }`}
      >
        {/* One highlight per sidebar, sliding to the new page on navigation. The
            link must not clip it (no overflow-hidden), or it vanishes in transit. */}
        {isActive && (
          <motion.span
            layoutId="sidebar-active"
            aria-hidden
            className="selected absolute inset-0 rounded-md"
            transition={SPRING}
          />
        )}
        <span className="relative flex items-center justify-center w-10 h-9 short:h-8 shorter:h-7 shrink-0">
          <Icon className="size-4.5 transition-[stroke-width] duration-[var(--duration-fast)]" strokeWidth={isActive ? 2 : 1.5} />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: '0.75rem' }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ duration: DURATION.base, ease: 'easeOut' }}
              className="relative truncate whitespace-nowrap"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </Tooltip>
  );
}

export function Sidebar({ identity, navGroups, pinnedLinks, userCard }: SidebarProps) {
  const { collapsed } = useSidebarCollapseContext();
  const { setOpen: setMobileOpen } = useMobileMenu();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;
  const onNavigate = forceExpanded ? () => setMobileOpen(false) : undefined;
  const { ref: navRef, above, below } = useScrollEdges<HTMLElement>();
  const navMask = scrollEdgeMask({ above, below });
  // One hover highlight for the whole rail: it follows the pointer down the
  // rows (nav and pinned links alike) instead of each row lighting up alone.
  const railRef = useRef<HTMLDivElement>(null);
  const glowRef = useHoverGlide(railRef, '[data-nav-row]');

  // AppShell renders this sidebar twice (desktop rail, mobile drawer); the group
  // keeps each copy's active highlight to itself.
  return (
    <LayoutGroup id={forceExpanded ? 'sidebar-mobile' : 'sidebar-desktop'}>
      {/* Same padding collapsed and expanded, so icons don't shift while the rail
          animates. Every row starts with a 2.5rem icon box (w-10), matching AppShell's
          4rem collapsed width: 0.75 + 2.5 + 0.75. */}
      <div ref={railRef} className="relative flex flex-col flex-1 min-h-0 pt-3 pb-2 gap-2 shorter:pt-2 shorter:gap-1.5 px-3">
        <span ref={glowRef} className="hover-glide" aria-hidden />
        {identity && <div className="relative shrink-0">{identity}</div>}

        <nav
          ref={navRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col gap-4 short:gap-3 shorter:gap-2"
          style={{ maskImage: navMask, WebkitMaskImage: navMask }}
        >
          {navGroups.map((group, gi) => (
            <div
              key={group.title ?? `group-${gi}`}
              className="flex flex-col gap-1"
              role="group"
              aria-label={group.title}
            >
              {group.title && (
                <div className="relative h-3.5 mx-1">
                  <AnimatePresence initial={false}>
                    {effectiveCollapsed
                      ? gi > 0 && (
                          <motion.div
                            key="sep"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: DURATION.fast, delay: 0.2 }}
                            className="absolute inset-0 flex items-center"
                            aria-hidden="true"
                          >
                            <div className="w-full h-px bg-line" />
                          </motion.div>
                        )
                      : (
                          <motion.p
                            key="title"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: DURATION.fast, delay: 0.2 }}
                            className="absolute inset-0 flex items-center text-xs text-[var(--lume-text-muted)] leading-none whitespace-nowrap"
                          >
                            {group.title}
                          </motion.p>
                        )}
                  </AnimatePresence>
                </div>
              )}
              <div className="flex flex-col gap-0.5 shorter:gap-0">
                {group.items.map((item) => (
                  <NavLink key={item.url} item={item} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {pinnedLinks && pinnedLinks.length > 0 && (
          <div className="flex flex-col gap-0.5 shorter:gap-0 shrink-0">
            {pinnedLinks.map((item) => (
              <NavLink key={item.url} item={item} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        {userCard && (
          <div className="shrink-0 pt-2 border-t border-line">
            {userCard}
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
