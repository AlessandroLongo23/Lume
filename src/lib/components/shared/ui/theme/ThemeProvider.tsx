'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePreferencesStore } from '@/lib/stores/preferences';

export type Theme = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** User-facing theme choice (may be 'system'). */
  theme: Theme;
  /** Theme actually applied to the document (never 'system'). */
  resolvedTheme: ResolvedTheme;
  /** Set the theme; also persists to localStorage (preferences sync is the caller's job). */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = 'theme';

function readSystemPref(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === 'system' ? readSystemPref() : theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const lastAppliedRef = useRef<ResolvedTheme | null>(null);

  const applyTheme = (t: Theme) => {
    const next = resolve(t);
    const apply = () => {
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY, t);
      setThemeState(t);
      setResolvedTheme(next);
      lastAppliedRef.current = next;
    };

    // Skip view transition on first paint (no previous state) and when the
    // resolved theme isn't actually changing — avoids the flash on full reload.
    const skipTransition =
      !document.startViewTransition ||
      document.visibilityState !== 'visible' ||
      lastAppliedRef.current === null ||
      lastAppliedRef.current === next;

    if (skipTransition) {
      apply();
      return;
    }

    document.startViewTransition(apply);
  };

  // Initial paint from localStorage (fast, no flash)
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const initial: Theme =
      raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
    applyTheme(initial);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const stored = (localStorage.getItem(STORAGE_KEY) ?? 'system') as Theme;
      if (stored === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sync from preferences store once it hydrates (DB is the source of truth)
  useEffect(() => {
    const unsub = usePreferencesStore.subscribe((state) => {
      if (!state.isLoaded) return;
      const dbTheme = state.preferences.appearance?.theme;
      if (!dbTheme) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === dbTheme) return;
      applyTheme(dbTheme);
    });
    return unsub;
  }, []);

  const setTheme = (t: Theme) => applyTheme(t);
  const toggleTheme = () => {
    // Toggling cycles between light and dark explicitly (drops 'system').
    applyTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
