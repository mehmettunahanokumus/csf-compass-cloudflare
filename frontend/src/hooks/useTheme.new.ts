/**
 * useTheme Hook - Rebuilt
 * Manages theme state (light/dark/system) with localStorage persistence
 */

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('csf-theme') as Theme) || 'system';
  });

  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('csf-theme', theme);
  }, [theme, resolved]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setThemeState('system'); // re-trigger
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme: setThemeState, resolved };
}
