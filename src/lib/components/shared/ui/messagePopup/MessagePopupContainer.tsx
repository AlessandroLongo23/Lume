'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { messagePopup } from './messagePopup';

export function MessagePopupContainer() {
  const messages = messagePopup((s) => s.messages);
  const dismiss = messagePopup((s) => s.dismiss);

  const icons = {
    success: <CheckCircle className="size-5 text-emerald-500" />,
    error: <XCircle className="size-5 text-red-500" />,
    info: <Info className="size-5 text-blue-500" />,
  };

  const bgClasses = {
    success: 'border-l-4 border-emerald-500 bg-white dark:bg-zinc-800',
    error: 'border-l-4 border-red-500 bg-white dark:bg-zinc-800',
    info: 'border-l-4 border-blue-500 bg-white dark:bg-zinc-800',
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-center gap-3 p-4 rounded-lg shadow-lg ${bgClasses[msg.type]}`}
        >
          {icons[msg.type]}
          <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{msg.message}</p>
          <button
            onClick={() => dismiss(msg.id)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
