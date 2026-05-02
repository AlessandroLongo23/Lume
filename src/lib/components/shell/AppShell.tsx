'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useSidebarCollapse } from './useSidebarCollapse';
import { SidebarCollapseContext, MobileMenuContext, SidebarForceExpandedContext } from './sidebarContext';
import { SidebarEdgeToggle } from './SidebarCollapseToggle';
import { SidebarShortcutHint } from './SidebarShortcutHint';
import { BugButton } from './BugButton';

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
  const bannerH = hasBanner ? 36 : 0;

  const sidebarW = useMotionValue(collapsed ? 64 : 240);
  const sidebarWPx = useTransform(sidebarW, (v) => `${v}px`);

  useEffect(() => {
    const controls = animate(sidebarW, collapsed ? 64 : 240, {
      duration: 0.22,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [collapsed, sidebarW]);

  const staticVars: CSSProperties = {
    ['--shell-banner-h' as string]: `${bannerH}px`,
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
    pathname === '/admin/servizi';

  return (
    <SidebarCollapseContext.Provider value={collapseState}>
      <MobileMenuContext.Provider value={{ open: mobileOpen, setOpen: setMobileOpen }}>
        <motion.div
          className="h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-foreground dark:text-white font-sans"
          style={{ ...staticVars, ['--shell-sidebar-w' as string]: sidebarWPx }}
        >
          {hasBanner && (
            <div className="fixed top-0 left-0 right-0 z-header h-[var(--shell-banner-h)]">
              {impersonationBanner}
            </div>
          )}

          <aside className="hidden md:flex fixed left-0 bottom-0 z-sidebar top-[var(--shell-banner-h)] w-[var(--shell-sidebar-w)] bg-zinc-50 dark:bg-zinc-950 flex-col overflow-y-auto overflow-x-hidden">
            <SidebarForceExpandedContext.Provider value={false}>
              {sidebar}
            </SidebarForceExpandedContext.Provider>
          </aside>

          <div
            className="hidden md:block fixed z-sidebar top-1/2 -translate-y-1/2 left-[calc(var(--shell-sidebar-w)+0.5rem)] -translate-x-1/2"
          >
            <SidebarEdgeToggle />
          </div>

          {mobileOpen && (
            <>
              <aside className="md:hidden fixed left-0 bottom-0 z-drawer top-[var(--shell-banner-h)] w-72 bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-y-auto">
                <div className="flex justify-end p-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label="Chiudi menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SidebarForceExpandedContext.Provider value={true}>
                  {sidebar}
                </SidebarForceExpandedContext.Provider>
              </aside>
              <button
                type="button"
                className="md:hidden fixed inset-0 z-drawer-backdrop bg-black/40"
                onClick={() => setMobileOpen(false)}
                aria-label="Chiudi menu"
              />
            </>
          )}

          <main className="h-screen flex flex-col pt-[var(--shell-banner-h)] pl-0 md:pl-[var(--shell-sidebar-w)]">
            <div className="flex-1 min-h-0 flex flex-col p-2">
              <div
                className={`flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 ${
                  isViewportFit ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
                }`}
              >
                <div className="sticky top-0 z-sticky h-16 bg-white dark:bg-zinc-900 rounded-t-xl">
                  {topBar}
                </div>
                <div
                  key={pageAnimationKey}
                  className={`shell-page-enter ${
                    isViewportFit
                      ? `flex-1 min-h-0 flex flex-col px-8 md:px-[4.125rem] ${isFullBleed ? 'pt-6 pb-6' : 'pt-10 pb-12'}`
                      : 'px-8 md:px-[4.125rem] pt-10 pb-12'
                  }`}
                >
                  {children}
                </div>
              </div>
            </div>
          </main>

          <SidebarShortcutHint />
          <BugButton />
        </motion.div>
      </MobileMenuContext.Provider>
    </SidebarCollapseContext.Provider>
  );
}
