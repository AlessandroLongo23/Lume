'use client';

import { useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { useSidebarCollapse } from './useSidebarCollapse';
import { SidebarCollapseContext, MobileMenuContext, SidebarForceExpandedContext } from './sidebarContext';
import { SidebarEdgeToggle } from './SidebarCollapseToggle';

interface AppShellProps {
  impersonationBanner?: React.ReactNode;
  sidebar: React.ReactNode;
  topBar: React.ReactNode;
  children: React.ReactNode;
}

type CSSVars = CSSProperties & {
  '--shell-banner-h'?: string;
  '--shell-chrome-h'?: string;
  '--shell-sidebar-w'?: string;
};

export function AppShell({ impersonationBanner, sidebar, topBar, children }: AppShellProps) {
  const collapseState = useSidebarCollapse();
  const { collapsed } = collapseState;
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasBanner = Boolean(impersonationBanner);
  const bannerH = hasBanner ? 36 : 0;
  const topBarH = 64;
  const chromeH = bannerH + topBarH;
  const sidebarW = collapsed ? 72 : 240;

  const cssVars: CSSVars = {
    '--shell-banner-h': `${bannerH}px`,
    '--shell-chrome-h': `${chromeH}px`,
    '--shell-sidebar-w': `${sidebarW}px`,
  };

  return (
    <SidebarCollapseContext.Provider value={collapseState}>
      <MobileMenuContext.Provider value={{ open: mobileOpen, setOpen: setMobileOpen }}>
        <div
          className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-foreground dark:text-white font-sans"
          style={cssVars}
        >
          {hasBanner && (
            <div className="fixed top-0 left-0 right-0 z-[60] h-[var(--shell-banner-h)]">
              {impersonationBanner}
            </div>
          )}

          <div className="fixed left-0 right-0 z-50 top-[var(--shell-banner-h)] h-16 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
            {topBar}
          </div>

          <aside className="hidden md:flex fixed left-0 bottom-0 z-40 top-[var(--shell-chrome-h)] w-[var(--shell-sidebar-w)] bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col overflow-y-auto">
            <SidebarForceExpandedContext.Provider value={false}>
              {sidebar}
            </SidebarForceExpandedContext.Provider>
          </aside>

          <div
            className="hidden md:block fixed z-[45] top-1/2 -translate-y-1/2 left-[var(--shell-sidebar-w)] -translate-x-1/2"
          >
            <SidebarEdgeToggle />
          </div>

          {mobileOpen && (
            <>
              <aside className="md:hidden fixed left-0 bottom-0 z-[55] top-[var(--shell-chrome-h)] w-72 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-y-auto">
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
                className="md:hidden fixed inset-0 z-[52] bg-black/40"
                onClick={() => setMobileOpen(false)}
                aria-label="Chiudi menu"
              />
            </>
          )}

          <main className="min-h-screen bg-white dark:bg-zinc-900 pt-[var(--shell-chrome-h)] pl-0 md:pl-[var(--shell-sidebar-w)]">
            <div className="px-4 md:px-6 py-6">{children}</div>
          </main>
        </div>
      </MobileMenuContext.Provider>
    </SidebarCollapseContext.Provider>
  );
}
