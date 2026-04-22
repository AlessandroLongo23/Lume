'use client';

import { Lightbulb, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { useMobileMenu } from './sidebarContext';
import { useSidebarCollapseContext } from './sidebarContext';

interface TopBarProps {
  rightCluster: React.ReactNode;
}

export function TopBar({ rightCluster }: TopBarProps) {
  const { setOpen } = useMobileMenu();
  const { collapsed } = useSidebarCollapseContext();

  return (
    <div className="h-full flex items-center">
      <div
        className="hidden md:flex items-center justify-start shrink-0 h-full px-4 overflow-hidden"
        style={{ width: 'var(--shell-sidebar-w)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex items-center"
            >
              <Lightbulb size={20} className="text-primary" strokeWidth={2.25} />
            </motion.div>
          ) : (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex items-center"
            >
              <LumeLogo size="sm" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex items-center justify-between gap-4 px-4 md:px-6 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="md:hidden">
            <LumeLogo size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">{rightCluster}</div>
      </div>
    </div>
  );
}
