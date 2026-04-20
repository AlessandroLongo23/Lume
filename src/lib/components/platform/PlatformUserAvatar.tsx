'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, Loader2 } from 'lucide-react';

interface PlatformUserAvatarProps {
  firstName: string;
  lastName:  string;
  email:     string;
}

export function PlatformUserAvatar({ firstName, lastName, email }: PlatformUserAvatarProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-semibold cursor-pointer select-none hover:bg-primary-hover transition-colors"
        aria-label="Menu utente"
      >
        {initials || '?'}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-60 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Super Admin</p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isLoggingOut ? 'Uscendo...' : 'Esci'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
