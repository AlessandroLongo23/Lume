'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { messagePopup } from './messagePopup';
import { Button } from '@/lib/components/shared/ui/Button';

export function MessagePopupContainer() {
  const messages = messagePopup((s) => s.messages);
  const dismiss = messagePopup((s) => s.dismiss);

  const icons = {
    success: <CheckCircle className="size-4.5 text-emerald-500 shrink-0" />,
    error: <XCircle className="size-4.5 text-red-500 shrink-0" />,
    info: <Info className="size-4.5 text-primary shrink-0" />,
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-toast flex flex-col gap-2 w-72">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 shadow-lg shadow-black/6"
        >
          {icons[msg.type]}
          <div className="flex-1 min-w-0">
            {msg.title && (
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{msg.title}</p>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{msg.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Chiudi"
            onClick={() => dismiss(msg.id)}
            className="shrink-0"
          >
            <X />
          </Button>
        </div>
      ))}
    </div>
  );
}
