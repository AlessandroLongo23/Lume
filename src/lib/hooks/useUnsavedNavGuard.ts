'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface Options {
  /** Whether the page currently has unsaved changes. */
  isDirty: boolean;
  /** Commit buffered changes. Resolves on success; on reject the navigation
   *  is aborted (user stays on the page). */
  onSave: () => Promise<void>;
  /** Discard buffered changes synchronously — usually resets local state to
   *  the current store baseline. */
  onDiscard: () => void;
}

interface State {
  /** True when the user attempted to leave the page with unsaved changes
   *  and the confirmation modal should be shown. */
  isPrompting: boolean;
  /** True while `onSave` is in flight after the user clicked "Salva" in the
   *  modal — drives the disabled/loading state on the buttons. */
  isSaving: boolean;
  /** User picked "Annulla" — close the modal and keep the user on the page. */
  cancel: () => void;
  /** User picked "Scarta" — discard the buffer and navigate. */
  discardAndLeave: () => void;
  /** User picked "Salva" — save the buffer, then navigate. */
  saveAndLeave: () => Promise<void>;
}

/**
 * Blocks navigation away from the page while `isDirty` is true. When the user
 * clicks an internal `<a>` or fires `beforeunload`, the hook intercepts and
 * surfaces a prompt. The page renders the dialog and wires its three buttons
 * into the returned `cancel` / `discardAndLeave` / `saveAndLeave` callbacks.
 *
 * Programmatic `router.push` calls are NOT intercepted (the page's own save
 * flow is expected to opt out by calling `onSave` then navigating directly).
 */
export function useUnsavedNavGuard({ isDirty, onSave, onDiscard }: Options): State {
  const router = useRouter();
  const pathname = usePathname();

  const [isPrompting, setIsPrompting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Pending in-app navigation target, if any.
  const pendingHrefRef = useRef<string | null>(null);
  // Latest dirty flag — captured so the document listener sees fresh state.
  const isDirtyRef = useRef(isDirty);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  // ── beforeunload: browser nav (refresh, close, external link) ───────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── click-capture: intercept internal <a> clicks while dirty ────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      // Only intercept internal navigation.
      if (!href.startsWith('/')) return;
      const targetAttr = anchor.getAttribute('target');
      if (targetAttr && targetAttr !== '_self') return;

      // Strip query/hash for comparison with pathname.
      const targetPath = href.split('?')[0].split('#')[0];
      if (targetPath === pathname) return;

      e.preventDefault();
      e.stopPropagation();
      pendingHrefRef.current = href;
      setIsPrompting(true);
    };
    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, [pathname]);

  const cancel = useCallback(() => {
    pendingHrefRef.current = null;
    setIsPrompting(false);
  }, []);

  const discardAndLeave = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    setIsPrompting(false);
    onDiscard();
    isDirtyRef.current = false;
    if (href) router.push(href);
  }, [onDiscard, router]);

  const saveAndLeave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      isDirtyRef.current = false;
      const href = pendingHrefRef.current;
      pendingHrefRef.current = null;
      setIsPrompting(false);
      if (href) router.push(href);
    } catch {
      // Keep modal open — caller already surfaced the error toast.
    } finally {
      setIsSaving(false);
    }
  }, [onSave, router]);

  return { isPrompting, isSaving, cancel, discardAndLeave, saveAndLeave };
}
