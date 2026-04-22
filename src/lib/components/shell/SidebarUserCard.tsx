'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Loader2, type LucideIcon } from 'lucide-react';
import { useSidebarCollapseContext, useSidebarForceExpanded } from './sidebarContext';

export type UserCardMenuItem =
  | { type: 'link'; label: string; href: string; icon?: LucideIcon }
  | { type: 'button'; label: string; onClick: () => void | Promise<void>; icon?: LucideIcon; danger?: boolean; loadingLabel?: string };

interface SidebarUserCardProps {
  name: string;
  role: string;
  avatarInitials: string;
  menuItems: UserCardMenuItem[];
}

export function SidebarUserCard({ name, role, avatarInitials, menuItems }: SidebarUserCardProps) {
  const [open, setOpen] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleItem(item: UserCardMenuItem, idx: number) {
    if (item.type !== 'button') return;
    setBusyIndex(idx);
    try {
      await item.onClick();
    } finally {
      setBusyIndex(null);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer overflow-hidden"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utente"
      >
        <div className="flex items-center min-w-0">
          <span className="flex items-center justify-center w-10 h-10 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-semibold">
              {avatarInitials || '?'}
            </span>
          </span>
          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.span
                key="identity"
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-col items-start min-w-0 leading-tight overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[140px]">{name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">{role}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {!effectiveCollapsed && (
            <motion.span
              key="chevron"
              initial={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 8, marginRight: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="shrink-0 overflow-hidden"
            >
              <ChevronDown className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full mb-2 left-0 right-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-[70] py-1"
        >
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.type === 'link') {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4" strokeWidth={1.5} />}
                  <span>{item.label}</span>
                </Link>
              );
            }
            const isBusy = busyIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => handleItem(item, idx)}
                disabled={isBusy}
                role="menuitem"
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors disabled:opacity-50 cursor-pointer ${
                  item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" strokeWidth={1.5} />}
                <span>{isBusy && item.loadingLabel ? item.loadingLabel : item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
