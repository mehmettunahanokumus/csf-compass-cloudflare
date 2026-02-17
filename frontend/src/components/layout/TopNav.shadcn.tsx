import { useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const pathTitles: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/assessments':     'Assessments',
  '/assessments/new': 'New Assessment',
  '/vendors':         'Vendors',
  '/analytics':       'Analytics',
  '/exports':         'Exports',
  '/organization':    'Organization',
  '/profile':         'Profile',
};

function getPageTitle(pathname: string): string {
  if (pathTitles[pathname]) return pathTitles[pathname];
  if (pathname.startsWith('/assessments/')) return 'Assessment Detail';
  if (pathname.startsWith('/vendors/')) return 'Vendor Detail';
  return 'Dashboard';
}

interface Props {
  onMenuClick: () => void;
}

const iconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid var(--t-border)',
  background: 'var(--t-card)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--t-text-muted)',
  cursor: 'pointer', transition: 'all 0.15s',
};

export default function TopNav({ onMenuClick }: Props) {
  const location  = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: 60,
        background: 'var(--t-card)',
        borderBottom: '1px solid var(--t-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        style={{ ...iconBtnStyle, display: 'none' }}
        className="mobile-menu-btn"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 500, color: 'var(--t-text-muted)' }}>
          CSF Compass
        </span>
        <ChevronRight size={14} style={{ color: 'var(--t-text-faint)' }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--t-text-primary)' }}>
          {pageTitle}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={iconBtnStyle}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = 'var(--t-accent-border)';
            el.style.color = 'var(--t-accent)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = 'var(--t-border)';
            el.style.color = 'var(--t-text-muted)';
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notification bell */}
        <button
          style={iconBtnStyle}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = 'var(--t-text-faint)';
            el.style.color = 'var(--t-text-primary)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = 'var(--t-border)';
            el.style.color = 'var(--t-text-muted)';
          }}
        >
          <Bell size={15} />
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'var(--t-border)' }} />

        {/* User avatar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px 5px 5px', borderRadius: 8,
            border: '1px solid var(--t-border)', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--t-text-faint)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--t-border)'; }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--t-accent-light)',
            border: '1px solid var(--t-accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 800, color: 'var(--t-accent)' }}>
              D
            </span>
          </div>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--t-text-primary)' }}>
            Demo
          </span>
        </div>
      </div>
    </header>
  );
}
