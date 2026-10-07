/**
 * ThemeContext — Light/dark mode. Sets data-theme (our CSS variables) and
 * data-bs-theme (Bootstrap components) on <html> and remembers the choice.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

export const ThemeContext = createContext(null);

function getInitialTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#061A30' : '#0B2545');
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // Storage unavailable (private mode): the theme still works for this visit.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(() => ({ theme, isDark: theme === 'dark', toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
