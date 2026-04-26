'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, CreditCard, LogOut, User, Lightbulb, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { adminRoutes, adminSettingsRoute } from '@/lib/const/data';
import { useSidebarCollapseContext, useSidebarForceExpanded } from '@/lib/components/shell/sidebarContext';
import { useSidebarCollapse } from '@/lib/components/shell/useSidebarCollapse';
import { Breadcrumbs, type BreadcrumbItem } from '@/lib/components/shell/Breadcrumbs';
import { StoreInitializer } from '@/lib/components/admin/StoreInitializer';
import { TrialWarningBanner } from '@/lib/components/admin/TrialWarningBanner';
import { ImpersonationBanner, useIsImpersonating } from '@/lib/components/admin/ImpersonationBanner';
import { SubscriptionCTA } from '@/lib/components/admin/SubscriptionCTA';
import { ThemeToggle } from '@/lib/components/shared/ui/theme/ThemeToggle';
import { AppShell } from '@/lib/components/shell/AppShell';
import { Sidebar, type SidebarNavGroup } from '@/lib/components/shell/Sidebar';
import { TopBar } from '@/lib/components/shell/TopBar';
import { SidebarUserCard, type UserCardMenuItem } from '@/lib/components/shell/SidebarUserCard';
import { CommandMenu, useCommandMenuController } from '@/lib/components/shell/CommandMenu';
import type { CommandAction } from '@/lib/components/shell/commandMenu/types';
import { CommandMenuTrigger } from '@/lib/components/shell/CommandMenuTrigger';
import { sidebarToggleLabel } from '@/lib/components/shell/keyboardShortcuts';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { isOwner, normalizeProfileRole } from '@/lib/auth/roles';
import { supabase } from '@/lib/supabase/client';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function LumeLogoBlock() {
  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;
  return (
    <div className="flex items-center justify-start min-w-0 overflow-hidden">
      <span className="flex items-center justify-center w-10 h-10 shrink-0">
        <Lightbulb className="w-5 h-5 text-primary" strokeWidth={2.25} />
      </span>
      <AnimatePresence initial={false}>
        {!effectiveCollapsed && (
          <motion.span
            key="lume-text"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 6 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-lg font-semibold tracking-tight text-foreground dark:text-white whitespace-nowrap"
          >
            Lume<span className="text-primary">.</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function SalonIdentityBlock() {
  const salonName = useSubscriptionStore((s) => s.salonName);
  const logoUrl = useSubscriptionStore((s) => s.logoUrl);
  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;
  if (!salonName) return null;
  return (
    <div className="flex items-center justify-start min-w-0 overflow-hidden">
      <span className="flex items-center justify-center w-10 h-10 shrink-0">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={salonName}
            width={32}
            height={32}
            className="rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
          />
        ) : (
          <span className="w-8 h-8 rounded-md bg-primary/15 dark:bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-hover dark:text-primary/70 leading-none">
              {getInitials(salonName)}
            </span>
          </span>
        )}
      </span>
      <AnimatePresence initial={false}>
        {!effectiveCollapsed && (
          <motion.p
            key="name"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate whitespace-nowrap"
          >
            {salonName}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isExpired = useSubscriptionStore((s) => s.isExpired);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const firstName = useSubscriptionStore((s) => s.firstName);
  const lastName = useSubscriptionStore((s) => s.lastName);
  const email = useSubscriptionStore((s) => s.email);
  const role = useSubscriptionStore((s) => s.role);
  const isAdmin = useSubscriptionStore((s) => s.isAdmin);
  const isImpersonating = useIsImpersonating();

  const controller = useCommandMenuController();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapse();

  useEffect(() => {
    if (isAdmin) return;
    if (!isLoading && isExpired && pathname !== '/admin/subscribe') {
      router.replace('/admin/subscribe');
    }
  }, [isAdmin, isLoading, isExpired, pathname, router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        messagePopup.getState().show(
          'Per proteggere i tuoi dati, la sessione è scaduta. Effettua di nuovo l\'accesso.',
          'info',
          8000,
          'top-right',
          'Bentornato!'
        );
        router.replace('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const navGroups = useMemo<SidebarNavGroup[]>(
    () =>
      adminRoutes.map((group) => ({
        title: group.title,
        items: group.routes.map((r) => ({
          name: r.name,
          url: `/admin/${r.url}`,
          icon: r.icon,
        })),
      })),
    []
  );

  const commandRole = useMemo(() => normalizeProfileRole({ role }), [role]);

  const commandExtraActions = useMemo<CommandAction[]>(
    () => [
      {
        id: 'toggle-sidebar',
        label: sidebarCollapsed ? 'Espandi barra laterale' : 'Comprimi barra laterale',
        icon: sidebarCollapsed ? PanelLeftOpen : PanelLeftClose,
        kbd: sidebarToggleLabel(),
        perform: () => toggleSidebar(),
      },
    ],
    [sidebarCollapsed, toggleSidebar],
  );

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;
  const roleLabel = role === 'owner' ? 'Titolare' : role === 'admin' ? 'Super admin' : 'Operatore';
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

  const userMenuItems = useMemo<UserCardMenuItem[]>(() => {
    const items: UserCardMenuItem[] = [
      { type: 'link', label: 'Profilo', href: '/admin/impostazioni', icon: User },
    ];
    if (isOwner(role)) {
      items.push({
        type: 'link',
        label: 'Fatturazione e abbonamento',
        href: '/admin/subscribe',
        icon: CreditCard,
      });
    }
    items.push({
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
    });
    return items;
  }, [role]);

  const sidebar = (
    <Sidebar
      identity={
        <div className="flex flex-col gap-2">
          <LumeLogoBlock />
          <SalonIdentityBlock />
        </div>
      }
      navGroups={navGroups}
      pinnedLinks={[
        {
          name: adminSettingsRoute.name,
          url: `/admin/${adminSettingsRoute.url}`,
          icon: adminSettingsRoute.icon,
        },
      ]}
      userCard={
        <SidebarUserCard
          name={displayName}
          role={roleLabel}
          avatarInitials={initials}
          menuItems={userMenuItems}
        />
      }
    />
  );

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] !== 'admin' || !segments[1]) return [];
    const slug = segments[1];
    if (slug === adminSettingsRoute.url) {
      return [{ label: adminSettingsRoute.name }];
    }
    for (const group of adminRoutes) {
      const route = group.routes.find((r) => r.url === slug);
      if (route) {
        return [{ label: group.title }, { label: route.name }];
      }
    }
    return [];
  }, [pathname]);

  const topBar = (
    <TopBar
      leftCluster={<Breadcrumbs items={breadcrumbItems} />}
      rightCluster={
        <>
          {isOwner(role) && <SubscriptionCTA />}
          <CommandMenuTrigger onOpen={controller.onOpen} />
          <ThemeToggle />
        </>
      }
    />
  );

  return (
    <AppShell
      impersonationBanner={isImpersonating ? <ImpersonationBanner /> : null}
      sidebar={sidebar}
      topBar={topBar}
    >
      <StoreInitializer />
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <TrialWarningBanner />
          {children}
        </>
      )}
      <CommandMenu
        open={controller.open}
        onClose={controller.onClose}
        role={commandRole}
        extraActions={commandExtraActions}
      />
    </AppShell>
  );
}
