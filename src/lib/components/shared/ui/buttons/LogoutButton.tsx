'use client';

import { useState } from 'react';
import { LogOut, Loader } from 'lucide-react';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <button
      disabled={isLoggingOut}
      onClick={handleLogout}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
        bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
        text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700
        transition-all duration-300 cursor-pointer
        ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span>{isLoggingOut ? 'Uscendo...' : 'Logout'}</span>
      {isLoggingOut ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
    </button>
  );
}
