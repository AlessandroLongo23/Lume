'use client';

import { Menu } from 'lucide-react';
import { useMobileMenu } from './sidebarContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
  rightCluster: React.ReactNode;
}

export function TopBar({ title, subtitle, rightCluster }: TopBarProps) {
  const { setOpen } = useMobileMenu();

  return (
    <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight truncate text-zinc-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">{rightCluster}</div>
    </div>
  );
}
