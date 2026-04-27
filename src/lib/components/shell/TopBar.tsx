'use client';

import { Menu } from 'lucide-react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { useMobileMenu } from './sidebarContext';

interface TopBarProps {
  rightCluster: React.ReactNode;
  leftCluster?: React.ReactNode;
}

export function TopBar({ rightCluster, leftCluster }: TopBarProps) {
  const { setOpen } = useMobileMenu();

  return (
    <div className="h-full flex items-center justify-between gap-4 px-4 ps-6 min-w-0">
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
        {leftCluster && (
          <div className="hidden md:flex items-center min-w-0">{leftCluster}</div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">{rightCluster}</div>
    </div>
  );
}
