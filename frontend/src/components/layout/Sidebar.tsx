/**
 * Application Sidebar
 * Reference-based: Clean sections with solid teal active state
 * Push layout: 240px when open, 0px when closed
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  BarChart3,
  FileDown,
  Settings as SettingsIcon,
  User,
  Shield,
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Assessments', path: '/assessments', icon: ClipboardList },
      { name: 'Vendors', path: '/vendors', icon: Building2 },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Exports', path: '/exports', icon: FileDown },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { name: 'Organization', path: '/organization', icon: SettingsIcon },
      { name: 'Profile', path: '/profile', icon: User },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className="flex-shrink-0 h-screen overflow-y-auto transition-all"
      style={{
        width: isOpen ? 'var(--sidebar-width)' : '0',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: `1px solid var(--sidebar-border)`,
        transitionDuration: 'var(--transition-sidebar)',
      }}
    >
      {/* Sidebar content - maintains 240px width when open */}
      <div className="w-60 h-full flex flex-col">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-6 flex-shrink-0">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--text-inverse)' }} />
          </div>
          <div>
            <h1
              className="font-semibold text-base leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              CSF Compass
            </h1>
            <p
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              NIST CSF 2.0
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto pb-4">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <h3
                className="uppercase text-[11px] font-medium tracking-[0.08em] px-5 mb-2"
                style={{
                  color: 'var(--sidebar-section-label)',
                  marginTop: section.title === 'MAIN' ? '0' : '24px',
                }}
              >
                {section.title}
              </h3>

              {/* Section Items */}
              <div className="px-3">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-2.5 my-0.5 rounded-[10px] text-sm transition-all"
                    style={({ isActive }) => ({
                      backgroundColor: isActive
                        ? 'var(--sidebar-active-bg)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--sidebar-text-active)'
                        : 'var(--sidebar-text)',
                      fontWeight: isActive ? '500' : '400',
                      transitionDuration: 'var(--transition-base)',
                    })}
                    onMouseEnter={(e) => {
                      const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                        e.currentTarget.style.color = 'var(--sidebar-text-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          style={{
                            color: isActive
                              ? 'var(--sidebar-icon-active)'
                              : 'var(--sidebar-icon)',
                          }}
                        >
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Card */}
        <div
          className="sticky bottom-0 flex items-center gap-3 px-5 py-4 border-t"
          style={{
            backgroundColor: 'var(--sidebar-bg)',
            borderTopColor: 'var(--sidebar-border)',
          }}
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
            }}
          >
            DU
          </div>
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              Demo User
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Administrator
            </p>
          </div>
          {/* Settings Icon */}
          <button
            className="p-1.5 rounded-md transition-colors flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
