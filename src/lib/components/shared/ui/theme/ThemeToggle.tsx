'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/lib/components/shared/ui/Button';

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button
      variant="secondary"
      size="md"
      iconOnly
      aria-label="Cambia tema"
      onClick={toggleTheme}
      data-capture-hide=""
    >
      <span className="relative size-5 flex items-center justify-center">
        <Sun
          strokeWidth={1.5}
          className="absolute size-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-zinc-950 dark:text-zinc-50"
        />
        <Moon
          strokeWidth={1.5}
          className="absolute size-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-zinc-950 dark:text-zinc-50"
        />
      </span>
    </Button>
  );
}
