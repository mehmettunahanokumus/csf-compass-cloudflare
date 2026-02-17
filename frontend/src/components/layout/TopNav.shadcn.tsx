import { useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronRight } from 'lucide-react';

const pathTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/assessments':  'Assessments',
  '/assessments/new': 'New Assessment',
  '/vendors':      'Vendors',
  '/analytics':    'Analytics',
  '/exports':      'Exports',
  '/organization': 'Organization',
  '/profile':      'Profile',
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

export default function TopNav({ onMenuClick }: Props) {
  const location  = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header
      style={{
        height: 60,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
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
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          background: 'transparent',
          color: '#64748B',
          cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            color: '#94A3B8',
          }}
        >
          CSF Compass
        </span>
        <ChevronRight size={14} style={{ color: '#CBD5E1' }} />
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
          }}
        >
          {pageTitle}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Notification bell */}
        <button
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = '#CBD5E1';
            el.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = '#E2E8F0';
            el.style.color = '#64748B';
          }}
        >
          <Bell size={15} />
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />

        {/* User avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 10px 5px 5px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#CBD5E1'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0'; }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'rgba(79,70,229,0.1)',
              border: '1px solid rgba(79,70,229,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 10,
                fontWeight: 800,
                color: '#4F46E5',
              }}
            >
              D
            </span>
          </div>
          <span
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: '#0F172A',
            }}
          >
            Demo
          </span>
        </div>
      </div>
    </header>
  );
}
