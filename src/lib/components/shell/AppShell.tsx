'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useSidebarCollapse } from './useSidebarCollapse';
import { SidebarCollapseContext, MobileMenuContext, SidebarForceExpandedContext } from './sidebarContext';
import { SidebarEdgeToggle } from './SidebarCollapseToggle';
import { SidebarShortcutHint } from './SidebarShortcutHint';
import { BugButton } from './BugButton';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { DURATION } from '@/lib/const/motion';

interface AppShellProps {
  impersonationBanner?: React.ReactNode;
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ impersonationBanner, sidebar, topBar, children }: AppShellProps) {
  const collapseState = useSidebarCollapse();
  const { collapsed, toggle } = collapseState;
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLElement>(null);

  // The phone drawer is portaled to the end of <body>, after the page in tab
  // order: move focus into it on open so Tab walks the menu, and hand focus
  // back to whatever opened it on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    drawerRef.current?.focus();
    return () => {
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== 'b') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      toggle();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const hasBanner = Boolean(impersonationBanner);
  const bannerH = hasBanner ? 2.25 : 0;

  // In rem, so the rail scales with "Dimensione interfaccia" along with its
  // contents. Collapsed = 0.75rem padding + 2.5rem icon box + 0.75rem padding.
  const sidebarW = useMotionValue(collapsed ? 4 : 15);
  const sidebarWRem = useTransform(sidebarW, (v) => `${v}rem`);

  useEffect(() => {
    const controls = animate(sidebarW, collapsed ? 4 : 15, {
      duration: DURATION.base,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [collapsed, sidebarW]);

  const staticVars: CSSProperties = {
    ['--shell-banner-h' as string]: `${bannerH}rem`,
  };

  const pageAnimationKey = pathname.startsWith('/admin/impostazioni')
    ? '/admin/impostazioni'
    : pathname;

  // Calendar fits the available area exactly — no outer scroll, no double scrollbars.
  const isFullBleed = pathname === '/admin/calendario';
  // Table pages own their own internal scroll: rows fit the viewport, pagination stays put.
  const isViewportFit =
    isFullBleed ||
    pathname === '/admin/clienti' ||
    pathname === '/admin/operatori' ||
    pathname === '/admin/abbonamenti' ||
    pathname === '/admin/coupons' ||
    pathname === '/admin/fiches' ||
    pathname === '/admin/magazzino' ||
    pathname === '/admin/ordini' ||
    pathname === '/admin/servizi' ||
    pathname === '/platform/prospects';

  return (
    <SidebarCollapseContext.Provider value={collapseState}>
      <MobileMenuContext.Provider value={{ open: mobileOpen, setOpen: setMobileOpen }}>
        <motion.div
          className="h-screen overflow-hidden bg-[var(--lume-bg)] text-[var(--lume-text)] font-sans"
          style={{ ...staticVars, ['--shell-sidebar-w' as string]: sidebarWRem }}
        >
          {hasBanner && (
            <div className="fixed top-0 left-0 right-0 z-header h-[var(--shell-banner-h)]">
              {impersonationBanner}
            </div>
          )}

          <aside className="hidden md:flex fixed left-0 bottom-0 z-sidebar top-[var(--shell-banner-h)] w-[var(--shell-sidebar-w)] bg-[var(--lume-bg)] flex-col overflow-y-auto overflow-x-hidden">
            <SidebarForceExpandedContext.Provider value={false}>
              {sidebar}
            </SidebarForceExpandedContext.Provider>
          </aside>

          <div
            className="hidden md:block fixed z-sidebar top-1/2 -translate-y-1/2 left-[calc(var(--shell-sidebar-w)+0.5rem)] -translate-x-1/2"
          >
            <SidebarEdgeToggle />
          </div>

          {/* Left nav drawer on phones. SidePanel only opens from the right
              with a title bar, so the drawer keeps its own surface. It is
              portaled to <body> and so no longer inherits this wrapper's
              --shell-banner-h: it carries the same value (staticVars) to open
              right under the impersonation banner. */}
          <Portal>
            {mobileOpen && (
              <>
                <aside
                  ref={drawerRef}
                  tabIndex={-1}
                  aria-label="Menu"
                  // ds-ignore: mobile nav drawer docked to the left edge, full height under the banner, not a panel floating over content
                  className="md:hidden fixed left-0 bottom-0 z-drawer top-[var(--shell-banner-h)] w-72 bg-[var(--lume-bg)] flex flex-col shadow-float overflow-y-auto outline-none"
                  style={staticVars}
                >
                  <div className="flex justify-end p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label="Chiudi menu"
                      onClick={() => setMobileOpen(false)}
                    >
                      <X />
                    </Button>
                  </div>
                  <SidebarForceExpandedContext.Provider value={true}>
                    {sidebar}
                  </SidebarForceExpandedContext.Provider>
                </aside>
                {/* ds-ignore: drawer backdrop, a full-screen scrim that closes the menu on tap, not a visible button */}
                <button
                  type="button"
                  className="md:hidden fixed inset-0 z-drawer-backdrop bg-[color-mix(in_oklab,var(--lume-overlay)_70%,transparent)]"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Chiudi menu"
                />
              </>
            )}
          </Portal>

          <main className="h-screen flex flex-col pt-[var(--shell-banner-h)] pl-0 md:pl-[var(--shell-sidebar-w)]">
            <div className="relative flex-1 min-h-0 flex flex-col p-2">
              {/* The content panel: card radius on the panel fill. Its hairline
                  is the overlay below: an inset shadow on the scroll container
                  would paint under the sticky top bar and the fade. */}
              <div
                className={`flex-1 min-h-0 rounded-xl bg-[var(--lume-panel)] ${
                  isViewportFit ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
                }`}
              >
                <div className="sticky top-0 z-sticky h-16 bg-[var(--lume-panel)] rounded-t-xl">
                  {topBar}
                  {!isViewportFit && (
                    <div
                      aria-hidden="true"
                      className="shell-content-fade pointer-events-none absolute inset-x-0 top-full h-8"
                    />
                  )}
                </div>
                <div
                  key={pageAnimationKey}
                  className={`shell-page-enter ${
                    isViewportFit
                      ? `flex-1 min-h-0 flex flex-col px-8 md:px-16.5 ${isFullBleed ? 'pt-6 pb-6' : 'pt-10 pb-12'}`
                      : 'px-8 md:px-16.5 pt-10 pb-12'
                  }`}
                >
                  {children}
                </div>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-2 z-sticky rounded-xl shadow-[inset_0_0_0_1px_var(--lume-line)]"
              />
            </div>
          </main>

          <SidebarShortcutHint />
          <BugButton />
        </motion.div>
      </MobileMenuContext.Provider>
    </SidebarCollapseContext.Provider>
  );
}
