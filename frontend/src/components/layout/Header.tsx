/**
 * Application Header (TopNav)
 * Reference-based: 56px sticky bar with breadcrumbs
 */

import { useLocation, Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

// Breadcrumb generator
function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [
    { label: 'Dashboard', path: '/dashboard' },
  ];

  // Route name mappings
  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard',
    assessments: 'Assessments',
    vendors: 'Vendors',
    analytics: 'Analytics',
    exports: 'Exports',
    organization: 'Organization',
    profile: 'Profile',
    new: 'New',
    comparison: 'Comparison',
  };

  // Build breadcrumb trail
  let currentPath = '';
  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    // Skip if it's a UUID (assessment/vendor detail pages)
    if (segment.match(/^[a-f0-9-]{36}$/)) {
      breadcrumbs.push({ label: 'Details', path: currentPath });
    } else {
      const label =
        routeNames[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, path: currentPath });
    }
  });

  // Remove duplicate Dashboard if we're on dashboard page
  if (breadcrumbs.length > 1 && breadcrumbs[0].path === breadcrumbs[1].path) {
    breadcrumbs.shift();
  }

  return breadcrumbs;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <header
      className="sticky top-0 flex items-center h-14 px-6 flex-shrink-0"
      style={{
        backgroundColor: 'var(--topnav-bg)',
        borderBottom: '1px solid var(--topnav-border)',
        zIndex: 40,
      }}
    >
      {/* Left Section: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Hamburger (visible on mobile, hidden on desktop) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md transition-colors flex-shrink-0"
          style={{
            color: 'var(--text-tertiary)',
            transitionDuration: 'var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 min-w-0 overflow-hidden">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && (
                <span
                  className="text-sm flex-shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ›
                </span>
              )}
              {index === breadcrumbs.length - 1 ? (
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-sm truncate transition-colors"
                  style={{
                    color: 'var(--text-tertiary)',
                    transitionDuration: 'var(--transition-base)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                  }}
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right Section: Bell + Demo Badge + Avatar + Name */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Notification Bell */}
        <button
          className="p-2 rounded-md transition-colors"
          style={{
            color: 'var(--text-tertiary)',
            transitionDuration: 'var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Demo Mode Badge */}
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
          }}
        >
          DEMO
        </span>

        {/* User Avatar + Name */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
            }}
          >
            DU
          </div>
          <span
            className="hidden md:inline text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Demo User
          </span>
        </div>
      </div>
    </header>
  );
}
