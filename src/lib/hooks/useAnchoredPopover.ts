'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface AnchoredPosition {
  left: number;
  top?: number;
  bottom?: number;
  /** The trigger's width, for panels that match it. */
  width: number;
}

interface Options {
  /** Expected panel height, to decide whether it fits below the trigger. */
  panelMaxHeight?: number;
  /** Gap between trigger and panel, in px. */
  offset?: number;
  /** Align the panel's right edge with the trigger's right edge. */
  align?: 'start' | 'end';
  /** Width the panel will have, needed for `align: 'end'`. */
  panelWidth?: number;
  /** Open beside the trigger (e.g. from a collapsed rail) instead of under it. */
  placement?: 'bottom' | 'right';
}

/**
 * Open/close state and fixed positioning for a panel anchored to a trigger:
 * opens below (or above when there is no room), closes on an outside click,
 * on Escape and when anything but the panel scrolls (a fixed panel would
 * otherwise drift from its trigger). Shared by every picker and menu, so they
 * all behave the same. Render the panel through <Portal> with
 * `style={{ position: 'fixed', ...position }}` and attach `panelRef`.
 */
export function useAnchoredPopover<T extends HTMLElement>(
  triggerRef: RefObject<T | null>,
  { panelMaxHeight = 300, offset = 4, align = 'start', panelWidth, placement = 'bottom' }: Options = {},
) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredPosition | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (placement === 'right') {
      // Align the panel's bottom with the trigger's when it would run off-screen.
      const fitsDown = rect.top + panelMaxHeight < window.innerHeight - 8;
      setPosition(
        fitsDown
          ? { left: rect.right + offset, top: rect.top, width: rect.width }
          : { left: rect.right + offset, bottom: window.innerHeight - rect.bottom, width: rect.width },
      );
      return;
    }
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelMaxHeight + offset && rect.top > spaceBelow;
    const left = align === 'end' && panelWidth ? Math.max(8, rect.right - panelWidth) : rect.left;
    setPosition(
      openUp
        ? { left, bottom: window.innerHeight - rect.top + offset, width: rect.width }
        : { left, top: rect.bottom + offset, width: rect.width },
    );
  }, [triggerRef, panelMaxHeight, offset, align, panelWidth, placement]);

  const show = useCallback(() => { measure(); setOpen(true); }, [measure]);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => (open ? hide() : show()), [open, hide, show]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    // Capture phase, so the popover closes before a surrounding Modal (which
    // listens on window) sees the key and closes too.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, triggerRef]);

  return { open, show, hide, toggle, position, panelRef, side: position?.bottom !== undefined ? ('top' as const) : ('bottom' as const) };
}
