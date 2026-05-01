'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePreferencesStore } from '@/lib/stores/preferences';

// Routes that should always render in light mode regardless of the user's
// saved theme preference (e.g. the public marketing landing).
const LIGHT_LOCKED_ROUTES = new Set(['/', '/login', '/register']);

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
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const lastAppliedRef = useRef<ResolvedTheme | null>(null);

  const applyTheme = (t: Theme) => {
    const isLightLocked = LIGHT_LOCKED_ROUTES.has(pathname);
    const next: ResolvedTheme = isLightLocked ? 'light' : resolve(t);
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

  // Re-apply when the route changes so light-locked pages flip correctly
  // when entered or left. Skipped on the very first render — the initial
  // paint effect above already handled it.
  useEffect(() => {
    if (lastAppliedRef.current === null) return;
    const stored = (localStorage.getItem(STORAGE_KEY) ?? 'system') as Theme;
    applyTheme(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    const next: Theme = resolvedTheme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    // Persist back to the saved preference so the choice survives a refresh.
    // Skipped pre-hydration: the user isn't authenticated yet or the store
    // hasn't loaded, and the DB-sync effect will reconcile on first load.
    const prefs = usePreferencesStore.getState();
    if (prefs.isLoaded) {
      void prefs.updatePreferences({ appearance: { theme: next } }).catch(() => {});
    }
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
