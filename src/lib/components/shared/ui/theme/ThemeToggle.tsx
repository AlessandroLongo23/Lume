'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      data-capture-hide=""
      className="relative flex items-center justify-center p-2
        bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
        hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all duration-100 ease-in-out cursor-pointer"
    >
      <div className="relative size-5 flex items-center justify-center">
        <Sun
          strokeWidth={1.5}
          className="absolute size-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-zinc-950 dark:text-zinc-50"
        />
        <Moon
          strokeWidth={1.5}
          className="absolute size-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-zinc-950 dark:text-zinc-50"
        />
      </div>
    </button>
  );
}
