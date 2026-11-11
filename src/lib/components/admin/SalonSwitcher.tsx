'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { DURATION } from '@/lib/const/motion';
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

// 32px square: the logo, or the initials on the neutral fill (same as HeroAvatar;
// indigo is for actions).
function SalonAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-md object-cover"
      />
    );
  }
  return (
    <span className="size-8 rounded-md bg-active flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-[var(--lume-text-secondary)] leading-none">
        {getInitials(name)}
      </span>
    </span>
  );
}

const PANEL_MIN_WIDTH = 240;

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
  const listRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<string | null>(null);

  const hasSwitcher = !isAdmin && businessContexts.length > 1;

  // Prefer the matching membership row so the active block matches what the
  // dropdown will show. Fall back to subscription store for single-salon and
  // admin paths (where businessContexts may be empty or not include the salon).
  const active = businessContexts.find((c) => c.salonId === activeSalonId);
  const displayName = active?.salonName ?? fallbackSalonName ?? '';
  const displayLogoUrl = active?.logoUrl ?? fallbackLogoUrl ?? null;

  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: businessContexts.length * 48 + 16,
    offset: 6,
  });

  const nav = useListNavigation({
    count: businessContexts.length,
    onPick: (i) => void handleSelect(businessContexts[i].salonId),
    onEscape: hide,
    listRef,
  });

  if (!displayName) return null;

  async function handleSelect(salonId: string) {
    if (pending) return;
    if (salonId === activeSalonId) {
      hide();
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
            transition={{ duration: DURATION.base, ease: 'easeOut' }}
            className="text-sm font-medium tracking-tight text-[var(--lume-text)] truncate whitespace-nowrap flex-1 min-w-0 text-left"
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
              transition={{ duration: DURATION.base, ease: 'easeOut' }}
              className="shrink-0 overflow-hidden"
            >
              <ChevronsUpDown className="size-4 text-[var(--lume-text-muted)]" strokeWidth={1.5} aria-hidden />
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
        // ds-ignore: a sidebar rail row (salon logo and name); the rail's hover glide paints its hover, where Button would paint its own fill and control height
        ref={triggerRef}
        type="button"
        onClick={() => { nav.setActive(-1); toggle(); }}
        onKeyDown={open ? nav.onKeyDown : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Cambia salone, attualmente ${displayName}`}
        // A row of the sidebar rail: its hover glide paints the hover (data-nav-row).
        data-nav-row=""
        className="relative w-full flex items-center justify-start min-w-0 overflow-hidden rounded-lg cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]"
      >
        {identityRow}
      </button>
      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              style={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                bottom: position.bottom,
                // The collapsed trigger is 40px wide: the list keeps a readable width.
                width: effectiveCollapsed ? PANEL_MIN_WIDTH + 20 : Math.max(position.width, PANEL_MIN_WIDTH),
              }}
            >
              <ListBox ref={listRef} role="listbox" aria-label="Seleziona un salone" onKeyDown={nav.onKeyDown}>
                {businessContexts.map((ctx, i) => {
                  const isActive = ctx.salonId === activeSalonId;
                  const isPending = pending === ctx.salonId;
                  return (
                    <ListRow
                      key={ctx.salonId}
                      selected={isActive}
                      highlighted={nav.active === i}
                      disabled={!!pending && !isPending}
                      aria-busy={isPending || undefined}
                      onMouseEnter={() => nav.setActive(i)}
                      onClick={() => handleSelect(ctx.salonId)}
                      trailing={
                        <span className="size-4 flex items-center justify-center shrink-0">
                          {isPending
                            ? <Loader2 className="size-4 animate-spin text-[var(--lume-text-muted)]" aria-hidden />
                            : isActive
                              ? <Check className="size-4 text-[var(--lume-text)]" strokeWidth={2} aria-hidden />
                              : null}
                        </span>
                      }
                      className="min-h-11 px-2"
                    >
                      <span className="flex items-center gap-3">
                        <SalonAvatar name={ctx.salonName} logoUrl={ctx.logoUrl} />
                        <span className="flex flex-col min-w-0 leading-tight">
                          <span className="truncate">{ctx.salonName}</span>
                          <span className="text-xs font-normal text-[var(--lume-text-muted)]">{roleLabel(ctx.role)}</span>
                        </span>
                      </span>
                    </ListRow>
                  );
                })}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
