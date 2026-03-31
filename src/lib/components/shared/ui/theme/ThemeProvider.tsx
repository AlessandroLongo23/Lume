'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.add('disable-transitions');
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
    setThemeState(t);
    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 100);
  };

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'light';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyTheme(stored);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setTheme = (t: Theme) => applyTheme(t);
  const toggleTheme = () => applyTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
