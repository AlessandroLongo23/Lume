'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { useNotificationsStore } from '@/lib/stores/notifications';
import type { Notification } from '@/lib/types/Notification';

const MAX_DISPLAYED = 20;

export function NotificationBell() {
  const router = useRouter();
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const remove = useNotificationsStore((s) => s.remove);
  const unread = notifications.filter((n) => !n.read_at);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleClickItem = (n: Notification) => {
    if (!n.read_at) void markAsRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const displayed = notifications.slice(0, MAX_DISPLAYED);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notifiche"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center size-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Bell className="size-4" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-white text-[10px] font-semibold leading-none">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && pos && (
          <Portal>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-label="Notifiche"
              className="fixed z-popover w-[22rem] max-w-[calc(100vw-1rem)] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden"
              style={{ top: pos.top, right: pos.right, transformOrigin: '100% 0%' }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              transition={{
                duration: reduceMotion ? 0.12 : 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
            <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifiche</p>
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Check className="size-3" />
                  Segna tutte come lette
                </button>
              )}
            </header>

            {displayed.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell className="mx-auto size-6 text-zinc-300 dark:text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-500">Nessuna notifica.</p>
              </div>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {displayed.map((n) => (
                  <li key={n.id}>
                    <NotificationItem
                      notification={n}
                      onClick={() => handleClickItem(n)}
                      onDelete={() => void remove(n.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </>
  );
}

function NotificationItem({
  notification: n,
  onClick,
  onDelete,
}: {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
}) {
  const unread = !n.read_at;
  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3 ${
        unread ? 'bg-primary/5' : ''
      } hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 text-left focus:outline-none"
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {n.title}
          {unread && (
            <span
              aria-label="Non letta"
              className="ml-2 inline-block size-1.5 rounded-full bg-primary align-middle"
            />
          )}
        </p>
        {n.body && (
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{n.body}</p>
        )}
        <p className="mt-1 text-[11px] text-zinc-400">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: it })}
        </p>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Elimina notifica"
        className="shrink-0 size-7 inline-flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
