/**
 * Application Sidebar Navigation
 * Always uses dark Slate theme (#131926)
 * Pushes content to the right when open
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
  LogOut,
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
      { name: 'Organization', path: '/organization', icon: Settings },
      { name: 'Profile', path: '/profile', icon: User },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleLogout = () => {
    // TODO: Implement logout logic
    alert('Logout functionality coming soon');
  };

  return (
    <aside
      style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      className={`
        border-r flex-shrink-0 h-screen
        transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'w-[260px]' : 'w-0'}
      `}
    >
      {/* Sidebar content - maintains fixed width when open */}
      <div className="w-[260px] h-full flex flex-col">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3 px-6 py-5 flex-shrink-0">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--sidebar-accent)' }}>
            <Shield className="w-6 h-6" style={{ color: 'var(--sidebar-text-active)' }} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight" style={{ color: 'var(--sidebar-logo-text)' }}>
              CSF Compass
            </h1>
            <p className="text-xs" style={{ color: 'var(--sidebar-logo-subtitle)' }}>
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
                className="uppercase text-xs font-semibold tracking-wider mt-6 mb-2 px-6"
                style={{ color: 'var(--sidebar-section-label)' }}
              >
                {section.title}
              </h3>

              {/* Section Items */}
              <div className="space-y-1 px-3">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                        isActive
                          ? 'font-medium border-l-[3px]'
                          : 'border-l-[3px] border-transparent'
                      }`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'var(--sidebar-bg-active)' : 'transparent',
                      color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      borderLeftColor: isActive ? 'var(--sidebar-accent)' : 'transparent',
                    })}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      if (!target.classList.contains('font-medium')) {
                        target.style.backgroundColor = 'var(--sidebar-bg-hover)';
                        target.style.color = 'var(--sidebar-text-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget;
                      if (!target.classList.contains('font-medium')) {
                        target.style.backgroundColor = 'transparent';
                        target.style.color = 'var(--sidebar-text)';
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          style={{
                            color: isActive ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)'
                          }}
                        >
                          <item.icon className="w-5 h-5" />
                        </span>
                        <span className="text-sm">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 pb-3 flex-shrink-0">
          <ThemeToggle />
        </div>

        {/* Divider */}
        <div className="mx-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}></div>

        {/* User Info Card */}
        <div className="mx-3 mb-3 mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--sidebar-user-bg)' }}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-inverse)' }}>
                DU
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-user-text)' }}>
                Demo User
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-user-role)' }}>
                Demo Organization
              </p>
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-xs py-1.5 rounded-md transition-colors"
            style={{
              color: 'var(--sidebar-text)',
              backgroundColor: 'transparent',
              border: '1px solid var(--sidebar-border)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-bg-hover)';
              e.currentTarget.style.color = 'var(--sidebar-text-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--sidebar-text)';
            }}
          >
            <LogOut className="w-3 h-3 inline mr-1" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
