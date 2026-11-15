'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * A hover highlight that follows the pointer between the rows of a list, the
 * way a hand moves down it, instead of each row lighting up on its own.
 * After EDL's docs shell (edl-docs `shell/glide.jsx`).
 *
 * - It fades in where the pointer enters and springs from row to row after.
 * - With `originSelector` (segmented controls, tabs) it is born at the
 *   selected item and travels to the hovered one, and hides while the
 *   pointer is over the selected item itself.
 * - With `followAttribute` it also tracks the row carrying that attribute
 *   (`data-highlighted` in Base UI menus and selects), so arrow keys move it.
 * - Keyboard focus (`:focus-visible`) moves it too.
 *
 * Vanilla DOM: no React render per pointer move. Render the returned ref on
 * an empty `<span className="hover-glide" />` as the host's FIRST child; the
 * host must be `position: relative`, and rows must paint above it (they do
 * when they are positioned, e.g. `relative`). Styles live in globals.css.
 */
export function useHoverGlide<T extends HTMLElement>(
  hostRef: RefObject<T | null>,
  rowSelector: string,
  options: { originSelector?: string; followAttribute?: string; enabled?: boolean } = {},
) {
  const glowRef = useRef<HTMLSpanElement>(null);
  const { originSelector, followAttribute, enabled = true } = options;

  useLayoutEffect(() => {
    const host = hostRef.current;
    const glow = glowRef.current;
    if (!host || !glow || !enabled) return undefined;

    let current: Element | null = null;

    const boxOf = (el: Element) => {
      const hr = host.getBoundingClientRect();
      const rr = el.getBoundingClientRect();
      return {
        x: rr.left - hr.left + host.scrollLeft - host.clientLeft,
        y: rr.top - hr.top + host.scrollTop - host.clientTop,
        w: rr.width,
        h: rr.height,
      };
    };

    const place = (el: Element) => {
      const b = boxOf(el);
      glow.style.transform = `translate(${b.x}px, ${b.y}px)`;
      glow.style.width = `${b.w}px`;
      glow.style.height = `${b.h}px`;
      // Match the row's corners (tiles and chips differ from list rows).
      glow.style.borderRadius = getComputedStyle(el).borderRadius;
    };

    const hide = () => {
      current = null;
      glow.classList.remove('is-on');
    };

    const moveTo = (row: Element | null) => {
      if (!row) return hide();
      if (row === current && glow.classList.contains('is-on')) return;
      const origin = originSelector ? host.querySelector(originSelector) : null;
      // Over the selected item the selection itself is the highlight.
      if (origin && origin === row) {
        current = row;
        glow.classList.remove('is-on');
        return;
      }
      const visible = glow.classList.contains('is-on');
      if (!visible) {
        // Born somewhere without travelling: at the selected item when there
        // is one (then it glides to the row), otherwise right on the row.
        glow.classList.add('is-jump');
        place(origin ?? row);
        void glow.getBoundingClientRect();
        glow.classList.remove('is-jump');
        if (origin) place(row);
      } else {
        place(row);
      }
      glow.classList.add('is-on');
      current = row;
    };

    const rowFrom = (target: EventTarget | null) => {
      const row = (target as Element | null)?.closest?.(rowSelector) ?? null;
      if (!row || !host.contains(row)) return null;
      if (row.matches('[aria-disabled="true"], :disabled, [data-disabled]')) return null;
      return row;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const row = rowFrom(e.target);
      if (row) moveTo(row);
    };
    // With a keyboard-active row (followAttribute), leaving returns the
    // highlight to it: the list can shrink out from under a resting pointer.
    const onLeave = () => {
      const lit = followAttribute ? host.querySelector(`${rowSelector}[${followAttribute}]`) : null;
      if (lit) { current = null; moveTo(lit); } else hide();
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as Element;
      if (!el.matches?.(':focus-visible')) return;
      const row = rowFrom(el);
      if (row) moveTo(row);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!host.contains(e.relatedTarget as Node | null) && !host.matches(':hover')) hide();
    };

    host.addEventListener('pointerover', onOver);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('focusin', onFocusIn);
    host.addEventListener('focusout', onFocusOut);

    // When the hovered item becomes the selected one (a click), the
    // selection takes over and the preview steps aside.
    let selectionObserver: MutationObserver | null = null;
    if (originSelector) {
      selectionObserver = new MutationObserver(() => {
        if (current && current.matches(originSelector)) glow.classList.remove('is-on');
      });
      selectionObserver.observe(host, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-checked', 'aria-selected', 'aria-current', 'data-active'],
      });
    }

    let observer: MutationObserver | null = null;
    if (followAttribute) {
      observer = new MutationObserver(() => {
        const lit = host.querySelector(`${rowSelector}[${followAttribute}]`);
        if (lit) moveTo(lit);
        else if (!host.matches(':hover')) hide();
      });
      // childList too: a list re-rendered by typing mounts rows that are
      // already highlighted, which no attribute change announces.
      observer.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: [followAttribute] });
      const initiallyLit = host.querySelector(`${rowSelector}[${followAttribute}]`);
      if (initiallyLit) moveTo(initiallyLit);
    }

    // Rows can move under a still pointer (scroll, resize): keep the box on its row.
    const resync = () => { if (current && glow.classList.contains('is-on')) place(current); };
    const ro = new ResizeObserver(resync);
    ro.observe(host);
    host.addEventListener('scroll', resync, { capture: true, passive: true });

    return () => {
      host.removeEventListener('pointerover', onOver);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('focusin', onFocusIn);
      host.removeEventListener('focusout', onFocusOut);
      observer?.disconnect();
      selectionObserver?.disconnect();
      ro.disconnect();
      host.removeEventListener('scroll', resync, { capture: true });
    };
  }, [hostRef, rowSelector, originSelector, followAttribute, enabled]);

  return glowRef;
}
