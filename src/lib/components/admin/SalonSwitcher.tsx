'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import {
  useSidebarCollapseContext,
  useSidebarForceExpanded,
} from '@/lib/components/shell/sidebarContext';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import type { WorkspaceContext } from '@/lib/types/Workspace';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function SalonAvatar({
  name,
  logoUrl,
  size = 32,
}: {
  name: string;
  logoUrl: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-md bg-primary/15 dark:bg-primary/20 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-xs font-semibold text-primary-hover dark:text-primary/70 leading-none">
        {getInitials(name)}
      </span>
    </span>
  );
}

function roleLabel(role: WorkspaceContext['role']): string {
  if (role === 'owner') return 'Titolare';
  if (role === 'operator') return 'Operatore';
  return 'Cliente';
}

export function SalonSwitcher() {
  const businessContexts = useWorkspaceStore((s) => s.businessContexts);
  const activeSalonId    = useWorkspaceStore((s) => s.activeSalonId);
  const setActiveSalon   = useWorkspaceStore((s) => s.setActiveSalon);
  const isAdmin          = useWorkspaceStore((s) => s.isAdmin);

  const fallbackSalonName = useSubscriptionStore((s) => s.salonName);
  const fallbackLogoUrl   = useSubscriptionStore((s) => s.logoUrl);

  const { collapsed } = useSidebarCollapseContext();
  const forceExpanded = useSidebarForceExpanded();
  const effectiveCollapsed = forceExpanded ? false : collapsed;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const hasSwitcher = !isAdmin && businessContexts.length > 1;

  // Prefer the matching membership row so the active block matches what the
  // dropdown will show. Fall back to subscription store for single-salon and
  // admin paths (where businessContexts may be empty or not include the salon).
  const active = businessContexts.find((c) => c.salonId === activeSalonId);
  const displayName = active?.salonName ?? fallbackSalonName ?? '';
  const displayLogoUrl = active?.logoUrl ?? fallbackLogoUrl ?? null;

  useLayoutEffect(() => {
    if (!open || !hasSwitcher || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      if (effectiveCollapsed) {
        setPos({ top: rect.top, left: rect.right + 8, width: 260 });
      } else {
        setPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 240) });
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, hasSwitcher, effectiveCollapsed]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!displayName) return null;

  async function handleSelect(salonId: string) {
    if (pending) return;
    if (salonId === activeSalonId) {
      setOpen(false);
      return;
    }
    setPending(salonId);
    try {
      await setActiveSalon(salonId);
      // Full reload — drops all Zustand store state so the new salon's data is
      // re-fetched cleanly via RLS. router.refresh() alone would not reset
      // client-side stores (clients, services, fiches, …).
      window.location.assign('/admin/calendario');
    } catch {
      setPending(null);
    }
  }

  const identityRow = (
    <>
      <span className="flex items-center justify-center w-10 h-10 shrink-0">
        <SalonAvatar name={displayName} logoUrl={displayLogoUrl} />
      </span>
      <AnimatePresence initial={false}>
        {!effectiveCollapsed && (
          <motion.span
            key="name"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate whitespace-nowrap flex-1 min-w-0 text-left"
          >
            {displayName}
          </motion.span>
        )}
      </AnimatePresence>
      {hasSwitcher && (
        <AnimatePresence initial={false}>
          {!effectiveCollapsed && (
            <motion.span
              key="chevron"
              initial={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 8, marginRight: 4 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0, marginRight: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="shrink-0 overflow-hidden"
            >
              <ChevronsUpDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </>
  );

  if (!hasSwitcher) {
    return (
      <div className="flex items-center justify-start min-w-0 overflow-hidden">
        {identityRow}
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Cambia salone, attualmente ${displayName}`}
        className="w-full flex items-center justify-start min-w-0 overflow-hidden rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {identityRow}
      </button>
      {open && pos && (
        <Portal>
          <div
            ref={panelRef}
            role="listbox"
            aria-label="Seleziona un salone"
            className="fixed rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-dropdown py-1"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {businessContexts.map((ctx) => {
              const isActive = ctx.salonId === activeSalonId;
              const isPending = pending === ctx.salonId;
              return (
                <button
                  key={ctx.salonId}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  disabled={!!pending}
                  onClick={() => handleSelect(ctx.salonId)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors cursor-pointer disabled:cursor-default ${
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/15'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <SalonAvatar name={ctx.salonName} logoUrl={ctx.logoUrl} />
                  <div className="flex flex-col items-start min-w-0 flex-1 leading-tight">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white truncate w-full">
                      {ctx.salonName}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {roleLabel(ctx.role)}
                    </span>
                  </div>
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isPending
                      ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      : isActive
                        ? <Check className="w-4 h-4 text-primary" strokeWidth={2} />
                        : null}
                  </span>
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </>
  );
}
