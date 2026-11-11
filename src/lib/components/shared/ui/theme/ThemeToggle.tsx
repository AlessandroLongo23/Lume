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
      <span className="relative size-4 flex items-center justify-center">
        <Sun
          strokeWidth={1.5}
          className="absolute size-4 rotate-0 scale-100 opacity-100 transition-[rotate,scale,opacity] duration-[var(--duration-base)] ease-[var(--ease-out)] dark:-rotate-90 dark:scale-50 dark:opacity-0 motion-reduce:transition-none text-[var(--lume-text)]"
        />
        <Moon
          strokeWidth={1.5}
          className="absolute size-4 rotate-90 scale-50 opacity-0 transition-[rotate,scale,opacity] duration-[var(--duration-base)] ease-[var(--ease-out)] dark:rotate-0 dark:scale-100 dark:opacity-100 motion-reduce:transition-none text-[var(--lume-text)]"
        />
      </span>
    </Button>
  );
}
