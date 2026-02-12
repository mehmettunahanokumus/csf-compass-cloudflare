/**
 * ThemeToggle Component
 * 3-state theme switcher: Light / System / Dark
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'system', icon: Monitor, label: 'System' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div
      className="flex items-center gap-1 rounded-lg p-1"
      style={{ backgroundColor: 'var(--sidebar-bg-hover)' }}
    >
      {options.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150"
          style={{
            backgroundColor: theme === mode ? 'var(--sidebar-bg-active)' : 'transparent',
            color: theme === mode ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
          }}
          onMouseEnter={(e) => {
            if (theme !== mode) {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-bg-hover)';
              e.currentTarget.style.color = 'var(--sidebar-text-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (theme !== mode) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--sidebar-text)';
            }
          }}
          aria-label={`Switch to ${label} theme`}
          title={`${label} theme`}
        >
          <Icon
            className="w-4 h-4"
            style={{
              color: theme === mode ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)',
            }}
          />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
