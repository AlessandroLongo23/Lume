'use client';

import { useRef, useEffect, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DropdownMenuItem {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  width?: string;
}

export function DropdownMenu({ items, width = 'w-48' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center justify-center size-9 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Altre opzioni"
      >
        <EllipsisVertical className="size-4 text-zinc-500" />
      </button>
      {open && (
        <div className={`absolute right-0 top-full mt-1 ${width} bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-20 py-1`}>
          {items.map((item) => (
            <button
              key={item.label}
              className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
              onClick={() => { item.onClick(); setOpen(false); }}
            >
              <item.icon className="size-4 text-zinc-400" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
