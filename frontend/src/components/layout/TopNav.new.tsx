/**
 * TopNav - Complete rewrite
 * 64px fixed header with logo, nav links (desktop), and New Assessment button
 */

import { NavLink, Link } from 'react-router-dom';
import { Menu, Shield, LayoutDashboard, ClipboardList, Building2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopNavProps {
  onMenuClick: () => void;
}

const navLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Assessments', path: '/assessments', icon: ClipboardList },
  { name: 'Vendors', path: '/vendors', icon: Building2 },
];

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function TopNavNew({ onMenuClick }: TopNavProps) {
  const isMobile = useIsMobile();

  return (
    <header
      style={{
        height: 'var(--topnav-h)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      {/* Left section: Hamburger (mobile) + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Hamburger - mobile only */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'color 150ms ease',
            }}
          >
            <Menu size={22} />
          </button>
        )}

        {/* Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={20} style={{ color: 'var(--text-on-accent)' }} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-1)',
              whiteSpace: 'nowrap',
            }}
          >
            CSF Compass
          </span>
        </Link>
      </div>

      {/* Center section: Nav links (desktop only) */}
      {!isMobile && (
        <nav
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-3)',
                textDecoration: 'none',
                position: 'relative',
                transition: 'color 150ms ease',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <link.icon size={18} style={{ color: isActive ? 'var(--accent)' : 'var(--text-4)' }} />
                  <span>{link.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Spacer on mobile to push button right */}
      {isMobile && <div style={{ flex: 1 }} />}

      {/* Right section: New Assessment button */}
      <div style={{ flexShrink: 0 }}>
        <Link
          to="/assessments/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 150ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={16} />
          <span>New Assessment</span>
        </Link>
      </div>
    </header>
  );
}
