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
      className="flex items-center gap-0.5 rounded-lg p-0.5 border"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)'
      }}
    >
      {options.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap overflow-hidden"
          style={{
            backgroundColor: theme === mode ? 'var(--sidebar-bg-active)' : 'transparent',
            color: theme === mode ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
            cursor: 'pointer',
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
          <span
            style={{
              color: theme === mode ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
