/**
 * Sidebar - Mobile-only drawer
 * Desktop: hidden (width 0)
 * Mobile: slide-from-left with backdrop overlay
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  BarChart3,
  FileDown,
  Settings,
  User,
  Shield,
  Sun,
  Moon,
  Monitor,
  X,
  Info,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme.new';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navSections = [
  {
    label: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Assessments', path: '/assessments', icon: ClipboardList },
      { name: 'Vendors', path: '/vendors', icon: Building2 },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Exports', path: '/exports', icon: FileDown },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { name: 'Organization', path: '/organization', icon: Settings },
      { name: 'Profile', path: '/profile', icon: User },
    ],
  },
];

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= breakpoint);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isDesktop;
}

export default function SidebarNew({ isOpen, onClose }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const isDesktop = useIsDesktop();

  // Don't render on desktop
  if (isDesktop) return null;

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 49,
            transition: 'opacity 200ms ease',
          }}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-w)',
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--border)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Header with logo + close button */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Shield size={18} style={{ color: 'var(--text-on-accent)' }} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-1)',
                  fontSize: '15px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                CSF Compass
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: '11px', lineHeight: 1.2 }}>
                NIST CSF 2.0
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav sections */}
        <nav style={{ marginTop: '16px', flex: 1 }}>
          {navSections.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              <div
                style={{
                  color: 'var(--text-4)',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '0 24px',
                  marginBottom: '4px',
                  marginTop: section.label === 'MAIN' ? '0' : '24px',
                }}
              >
                {section.label}
              </div>

              {/* Nav items */}
              <div style={{ padding: '0 12px' }}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--text-on-accent)' : 'var(--text-3)',
                      background: isActive ? 'var(--sidebar-active)' : 'transparent',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      marginBottom: '2px',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={20}
                          style={{ color: isActive ? 'var(--text-on-accent)' : 'var(--text-4)' }}
                        />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* NIST CSF info card */}
        <div
          style={{
            margin: '16px 12px',
            padding: '14px',
            background: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>
              NIST CSF 2.0 Framework
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
            A comprehensive cybersecurity framework providing guidance for managing and reducing cybersecurity risk.
          </p>
        </div>

        {/* Theme toggle */}
        <div style={{ margin: '0 12px 12px' }}>
          <div
            style={{
              background: 'var(--ground)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              gap: '2px',
            }}
          >
            {[
              { mode: 'light' as const, icon: Sun, label: 'Light' },
              { mode: 'system' as const, icon: Monitor, label: 'Sys' },
              { mode: 'dark' as const, icon: Moon, label: 'Dark' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  textAlign: 'center',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: theme === mode ? 500 : 400,
                  color: theme === mode ? 'var(--text-1)' : 'var(--text-3)',
                  background: theme === mode ? 'var(--card)' : 'transparent',
                  boxShadow: theme === mode ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 150ms ease',
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
