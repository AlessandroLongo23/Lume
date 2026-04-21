'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LineChart,
  MessageSquare,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '@/lib/components/shell/AppShell';
import { Sidebar, type SidebarNavGroup } from '@/lib/components/shell/Sidebar';
import { TopBar } from '@/lib/components/shell/TopBar';
import { SidebarUserCard, type UserCardMenuItem } from '@/lib/components/shell/SidebarUserCard';
import {
  CommandMenu,
  useCommandMenuController,
  type CommandItem,
} from '@/lib/components/shell/CommandMenu';
import { CommandMenuTrigger } from '@/lib/components/shell/CommandMenuTrigger';
import { ThemeToggle } from '@/lib/components/shared/ui/theme/ThemeToggle';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

type PlatformLink = { href: string; label: string; icon: LucideIcon; keywords?: string[] };

const LINKS: PlatformLink[] = [
  { href: '/platform/salons',   label: 'Saloni',   icon: Building2,      keywords: ['clienti', 'tenants', 'workspace'] },
  { href: '/platform/metrics',  label: 'Metriche', icon: LineChart,      keywords: ['analytics', 'kpi', 'dashboard'] },
  { href: '/platform/feedback', label: 'Feedback', icon: MessageSquare,  keywords: ['roadmap', 'suggerimenti'] },
];

function titleFor(pathname: string): string {
  const match = LINKS.find((l) => pathname.startsWith(l.href));
  return match?.label ?? 'Platform';
}

function PlatformIdentity() {
  return (
    <div className="flex items-center gap-2 px-1 py-1 min-w-0">
      <LumeLogo size="sm" />
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary-hover dark:bg-primary/20 dark:text-primary/70 uppercase tracking-wider shrink-0">
        Platform
      </span>
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
  const pathname = usePathname();
  const controller = useCommandMenuController();

  const navGroups = useMemo<SidebarNavGroup[]>(
    () => [
      {
        items: LINKS.map((l) => ({ name: l.label, url: l.href, icon: l.icon })),
      },
    ],
    []
  );

  const commandItems = useMemo<CommandItem[]>(
    () =>
      LINKS.map((l) => ({
        type: 'nav' as const,
        label: l.label,
        href: l.href,
        icon: l.icon,
        keywords: l.keywords,
        group: 'Vai a',
      })),
    []
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
      primaryAction={<CommandMenuTrigger variant="sidebar" onOpen={controller.onOpen} />}
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
      title={titleFor(pathname)}
      rightCluster={
        <>
          <CommandMenuTrigger variant="topbar" onOpen={controller.onOpen} />
          <ThemeToggle />
        </>
      }
    />
  );

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      {children}
      <CommandMenu open={controller.open} onClose={controller.onClose} items={commandItems} />
    </AppShell>
  );
}
