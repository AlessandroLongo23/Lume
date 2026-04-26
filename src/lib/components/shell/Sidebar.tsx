'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { useSidebarCollapseContext, useMobileMenu, useSidebarForceExpanded } from './sidebarContext';

export type SidebarNavItem = {
  name: string;
  url: string;          // absolute or segment — fully rendered href
  icon: LucideIcon;
  matcher?: (pathname: string) => boolean;
};

export type SidebarNavGroup = {
  title?: string;
  items: SidebarNavItem[];
};

interface SidebarProps {
  identity?: React.ReactNode;
  navGroups: SidebarNavGroup[];
  pinnedLinks?: SidebarNavItem[];
  helpLinks?: { label: string; href: string }[];
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
    <Link
      href={item.url}
      onClick={onNavigate}
      title={collapsed ? item.name : undefined}
      className={`flex items-center text-sm rounded-md overflow-hidden transition-colors ${
        isActive
          ? 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:text-muted-foreground dark:hover:text-white dark:hover:bg-zinc-900'
      }`}
    >
      <span className="flex items-center justify-center w-10 h-10 shrink-0">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </span>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="truncate whitespace-nowrap"
          >
            {item.name}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

export function Sidebar({ identity, navGroups, pinnedLinks, helpLinks, userCard }: SidebarProps) {
  const { collapsed } = useSidebarCollapseContext();
  const { setOpen: setMobileOpen } = useMobileMenu();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;
  const onNavigate = forceExpanded ? () => setMobileOpen(false) : undefined;

  return (
    <div className={`flex flex-col flex-1 min-h-0 pt-4 pb-3 gap-3 pl-4 ${effectiveCollapsed ? 'pr-2' : 'pr-3'}`}>
      {identity && <div className="shrink-0">{identity}</div>}

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-4">
        {navGroups.map((group, gi) => (
          <div
            key={group.title ?? `group-${gi}`}
            className="flex flex-col gap-1.5"
            role="group"
            aria-label={group.title}
          >
            {group.title && (
              <div className="relative h-4 mx-1">
                <AnimatePresence initial={false}>
                  {effectiveCollapsed
                    ? gi > 0 && (
                        <motion.div
                          key="sep"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, delay: 0.2 }}
                          className="absolute inset-0 flex items-center"
                          aria-hidden="true"
                        >
                          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800" />
                        </motion.div>
                      )
                    : (
                        <motion.p
                          key="title"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, delay: 0.2 }}
                          className="absolute inset-0 flex items-center text-xs font-regular uppercase tracking-wide text-zinc-500 leading-none whitespace-nowrap"
                        >
                          {group.title}
                        </motion.p>
                      )}
                </AnimatePresence>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink key={item.url} item={item} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {pinnedLinks && pinnedLinks.length > 0 && (
        <div className="flex flex-col gap-0.5 shrink-0">
          {pinnedLinks.map((item) => (
            <NavLink key={item.url} item={item} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
          ))}
        </div>
      )}

      {helpLinks && helpLinks.length > 0 && !effectiveCollapsed && (
        <div className="flex flex-col gap-0.5 shrink-0 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {helpLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {userCard && (
        <div className="shrink-0 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {userCard}
        </div>
      )}
    </div>
  );
}
