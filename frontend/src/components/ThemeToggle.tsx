/**
 * ThemeToggle Component
 * Reference-based segmented control for theme switching
 * 3 segments: Light | System | Dark
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'system', icon: Monitor, label: 'Sys' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div
      className="mx-3 mb-3 p-1 flex items-center gap-0.5 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-ground)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {options.map(({ mode, icon: Icon, label }) => {
        const isActive = theme === mode;
        return (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium text-center whitespace-nowrap transition-all cursor-pointer"
            style={{
              backgroundColor: isActive ? 'var(--surface-base)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              transitionDuration: 'var(--transition-base)',
            }}
            aria-label={`Switch to ${label} theme`}
            title={`${label} theme`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
