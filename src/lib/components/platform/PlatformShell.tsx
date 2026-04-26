'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Lightbulb,
  LineChart,
  MessageSquare,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '@/lib/components/shell/AppShell';
import { Sidebar, type SidebarNavGroup } from '@/lib/components/shell/Sidebar';
import { TopBar } from '@/lib/components/shell/TopBar';
import { SidebarUserCard, type UserCardMenuItem } from '@/lib/components/shell/SidebarUserCard';
import { useCommandMenuController } from '@/lib/components/shell/CommandMenu';
import {
  BasicCommandMenu,
  type BasicCommandItem,
} from '@/lib/components/shell/BasicCommandMenu';
import { CommandMenuTrigger } from '@/lib/components/shell/CommandMenuTrigger';
import { ThemeToggle } from '@/lib/components/shared/ui/theme/ThemeToggle';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { useSidebarCollapseContext, useSidebarForceExpanded } from '@/lib/components/shell/sidebarContext';
import { useSidebarCollapse } from '@/lib/components/shell/useSidebarCollapse';
import { sidebarToggleLabel } from '@/lib/components/shell/keyboardShortcuts';

type PlatformLink = { href: string; label: string; icon: LucideIcon; keywords?: string[] };

const LINKS: PlatformLink[] = [
  { href: '/platform/salons',   label: 'Saloni',   icon: Building2,      keywords: ['clienti', 'tenants', 'workspace'] },
  { href: '/platform/metrics',  label: 'Metriche', icon: LineChart,      keywords: ['analytics', 'kpi', 'dashboard'] },
  { href: '/platform/feedback', label: 'Feedback', icon: MessageSquare,  keywords: ['roadmap', 'suggerimenti'] },
];

function PlatformIdentity() {
  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;
  return (
    <div className="flex items-center justify-start min-w-0 overflow-hidden">
      {effectiveCollapsed ? (
        <span className="flex items-center justify-center w-10 h-10 shrink-0">
          <Lightbulb size={20} className="text-primary" strokeWidth={2.25} />
        </span>
      ) : (
        <span className="flex items-center justify-center h-10 shrink-0 pl-2.5">
          <LumeLogo size="sm" />
        </span>
      )}
      <AnimatePresence initial={false}>
        {!effectiveCollapsed && (
          <motion.span
            key="badge"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary-hover dark:bg-primary/20 dark:text-primary/70 uppercase tracking-wider shrink-0 whitespace-nowrap"
          >
            Platform
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PlatformShellProps {
  firstName: string;
  lastName:  string;
  email:     string;
  children:  React.ReactNode;
}

export function PlatformShell({ firstName, lastName, email, children }: PlatformShellProps) {
  const controller = useCommandMenuController();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapse();

  const navGroups = useMemo<SidebarNavGroup[]>(
    () => [
      {
        items: LINKS.map((l) => ({ name: l.label, url: l.href, icon: l.icon })),
      },
    ],
    []
  );

  const commandItems = useMemo<BasicCommandItem[]>(
    () => [
      ...LINKS.map<BasicCommandItem>((l) => ({
        type: 'nav',
        label: l.label,
        href: l.href,
        icon: l.icon,
        keywords: l.keywords,
        group: 'Vai a',
      })),
      {
        type: 'action',
        label: sidebarCollapsed ? 'Espandi barra laterale' : 'Comprimi barra laterale',
        icon: sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
        kbd: sidebarToggleLabel(),
        onSelect: toggleSidebar,
        keywords: ['sidebar', 'menu', 'comprimi', 'espandi', 'nascondi', 'barra'],
        group: 'Visualizzazione',
      },
    ],
    [sidebarCollapsed, toggleSidebar]
  );

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

  const userMenuItems: UserCardMenuItem[] = [
    {
      type: 'button',
      label: 'Esci',
      loadingLabel: 'Uscendo…',
      icon: LogOut,
      danger: true,
      onClick: async () => {
        try {
          await fetch('/auth/logout', { method: 'POST' });
        } finally {
          window.location.href = '/';
        }
      },
    },
  ];

  const sidebar = (
    <Sidebar
      identity={<PlatformIdentity />}
      navGroups={navGroups}
      userCard={
        <SidebarUserCard
          name={displayName}
          role="Super admin"
          avatarInitials={initials}
          menuItems={userMenuItems}
        />
      }
    />
  );

  const topBar = (
    <TopBar
      rightCluster={
        <>
          <CommandMenuTrigger onOpen={controller.onOpen} />
          <ThemeToggle />
        </>
      }
    />
  );

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      {children}
      <BasicCommandMenu open={controller.open} onClose={controller.onClose} items={commandItems} />
    </AppShell>
  );
}
