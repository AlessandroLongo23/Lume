'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { Button } from '@/lib/components/shared/ui/Button';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { useNotificationsStore } from '@/lib/stores/notifications';
import type { Notification } from '@/lib/types/Notification';

const MAX_DISPLAYED = 20;
const PANEL_WIDTH = 352;

export function NotificationBell() {
  const router = useRouter();
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const remove = useNotificationsStore((s) => s.remove);
  const unread = notifications.filter((n) => !n.read_at);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 440,
    offset: 8,
    align: 'end',
    panelWidth: PANEL_WIDTH,
  });

  const handleClickItem = (n: Notification) => {
    if (!n.read_at) void markAsRead(n.id);
    if (n.link) {
      hide();
      router.push(n.link);
    }
  };

  const displayed = notifications.slice(0, MAX_DISPLAYED);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        iconOnly
        aria-label={unread.length > 0 ? `Notifiche, ${unread.length} non lette` : 'Notifiche'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <Bell />
        {unread.length > 0 && (
          <NumberBadge
            value={unread.length}
            max={9}
            variant="accent"
            size="sm"
            className="absolute -top-1 -right-1 ring-2 ring-[var(--lume-bg)]"
          />
        )}
      </Button>

      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              role="dialog"
              aria-label="Notifiche"
              className="max-w-[calc(100vw-1rem)]"
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: PANEL_WIDTH }}
            >
              <header className="flex items-center justify-between gap-3 h-12 pl-4 pr-2 border-b border-line">
                <p className="text-sm font-medium text-[var(--lume-text)]">Notifiche</p>
                {unread.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={Check}
                    onClick={() => void markAllAsRead()}
                    // ds-ignore: a labelled sm Button keeps 32px on touch (only md and icon-only grow to 44px), so the panel header action adds the touch height itself
                    className="pointer-coarse:h-11"
                  >
                    Segna tutte come lette
                  </Button>
                )}
              </header>

              {displayed.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell className="mx-auto size-5 text-[var(--lume-text-muted)]" strokeWidth={1.5} aria-hidden />
                  <p className="mt-3 text-sm text-[var(--lume-text-secondary)]">Nessuna notifica.</p>
                </div>
              ) : (
                <ListBox role="list" className="max-h-96 overflow-y-auto overscroll-contain">
                  {displayed.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onClick={() => handleClickItem(n)}
                      onDelete={() => void remove(n.id)}
                    />
                  ))}
                </ListBox>
              )}
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
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
    // Two actions per row (open, delete), so the row is a recipe-styled
    // element holding two buttons, not a <ListRow> button.
    <div role="listitem" data-list-row="" className="list-row group items-start gap-2 pl-3 pr-1 py-2.5 cursor-default">
      <button
        // ds-ignore: the open half of a two-action notification row, an unstyled text block inside the list-row; Button would add its control height, padding and fill
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 text-left focus:outline-none"
      >
        <p className={`flex items-center gap-2 text-sm ${unread ? 'font-medium text-[var(--lume-text)]' : 'text-[var(--lume-text-secondary)]'}`}>
          <span className="truncate">{n.title}</span>
          {unread && (
            <span
              role="img"
              aria-label="Non letta"
              className="inline-block size-1.5 shrink-0 rounded-full bg-[var(--lume-accent)]"
            />
          )}
        </p>
        {n.body && (
          <p className="mt-0.5 text-xs text-[var(--lume-text-secondary)] line-clamp-2">{n.body}</p>
        )}
        <p className="mt-1 text-xs text-[var(--lume-text-muted)]">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: it })}
        </p>
      </button>
      <Button
        variant="ghost-destructive"
        size="sm"
        iconOnly
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Elimina notifica"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}
