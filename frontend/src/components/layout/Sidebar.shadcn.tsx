import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import CompassLogo from '../CompassLogo';

const LS_LOGO  = 'csf-org-logo';
const LS_NAME  = 'csf-org-name';
const LS_COLOR = 'csf-org-color';
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  Network,
  BarChart3,
  FileDown,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const navSections = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard',   path: '/dashboard',   icon: LayoutDashboard },
      { name: 'Assessments', path: '/assessments',  icon: FileCheck       },
      { name: 'Vendors',     path: '/vendors',      icon: Building2       },
      { name: 'Group Companies', path: '/company-groups', icon: Network      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Reporting Center', path: '/exports', icon: FileDown },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Organization', path: '/organization', icon: Settings },
      { name: 'Profile',      path: '/profile',      icon: User     },
    ],
  },
];

// Tooltip for icon-only mode
function NavTooltip({ label, visible }: { label: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute',
      left: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
      background: '#1E293B',
      color: '#F1F5F9',
      fontFamily: 'Manrope, sans-serif',
      fontSize: 12,
      fontWeight: 600,
      padding: '5px 10px',
      borderRadius: 6,
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {label}
      <div style={{
        position: 'absolute',
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderRight: '4px solid #1E293B',
      }} />
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ open, onClose }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [orgLogo, setOrgLogo] = useState<string | null>(() => localStorage.getItem(LS_LOGO));
  const [orgName, setOrgName] = useState<string | null>(() => localStorage.getItem(LS_NAME));

  // Listen for branding changes from Organization settings page
  useEffect(() => {
    const handler = () => {
      setOrgLogo(localStorage.getItem(LS_LOGO));
      setOrgName(localStorage.getItem(LS_NAME));
      const color = localStorage.getItem(LS_COLOR);
      if (color) document.documentElement.style.setProperty('--t-accent', color);
    };
    window.addEventListener('csf-branding-change', handler);
    return () => window.removeEventListener('csf-branding-change', handler);
  }, []);

  const w = collapsed ? 64 : 256;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 25,
          }}
          className="mobile-overlay"
        />
      )}

      <aside
        style={{
          width: w,
          minWidth: w,
          background: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* ── Brand ──────────────────────────────── */}
        <div style={{
          padding: collapsed ? '18px 0' : '18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          overflow: 'hidden',
          transition: 'padding 0.22s',
        }}>
          {/* Logo icon — custom org logo or CSF Compass brand mark */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: orgLogo ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: orgLogo ? '1px solid rgba(255,255,255,0.1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {orgLogo
              ? <img src={orgLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <CompassLogo size={34} />
            }
          </div>

          {/* Brand name — hidden when collapsed */}
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                color: '#F8FAFC',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Compass
              </div>
              {orgName && (
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--text-3)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 1,
                }}>
                  {orgName}
                </div>
              )}
            </div>
          )}

          {/* Mobile close */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#475569',
              padding: 2,
              display: 'none',
            }}
            className="mobile-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navigation ─────────────────────────── */}
        <nav style={{ flex: 1, padding: collapsed ? '8px 6px' : '8px 10px', overflow: 'hidden' }}>
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: 2 }}>
              {/* Section label — hidden when collapsed */}
              {!collapsed && (
                <div style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.11em',
                  textTransform: 'uppercase',
                  color: '#334155',
                  padding: '13px 8px 5px',
                  whiteSpace: 'nowrap',
                }}>
                  {section.label}
                </div>
              )}
              {/* Separator when collapsed */}
              {collapsed && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map((item) => (
                  <div
                    key={item.path}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => collapsed && setTooltip(item.name)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.name : undefined}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? 0 : 10,
                        padding: collapsed ? '9px 0' : '8px 10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#A5B4FC' : '#64748B',
                        background: isActive ? 'rgba(99,102,241,0.14)' : 'transparent',
                        transition: 'all 0.14s',
                        position: 'relative',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      })}
                      onMouseEnter={e => {
                        const el = e.currentTarget;
                        if (!el.style.background.includes('99,102,241')) {
                          el.style.background = 'rgba(255,255,255,0.05)';
                          el.style.color = '#CBD5E1';
                        }
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget;
                        if (!el.style.background.includes('99,102,241')) {
                          el.style.background = 'transparent';
                          el.style.color = '#64748B';
                        }
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active bar */}
                          {isActive && !collapsed && (
                            <div style={{
                              position: 'absolute',
                              left: 0, top: '18%',
                              width: 3, height: '64%',
                              background: '#6366F1',
                              borderRadius: '0 2px 2px 0',
                            }} />
                          )}
                          <item.icon
                            size={16}
                            style={{
                              flexShrink: 0,
                              color: isActive ? '#A5B4FC' : 'inherit',
                            }}
                          />
                          {!collapsed && <span>{item.name}</span>}
                        </>
                      )}
                    </NavLink>
                    {/* Tooltip */}
                    {collapsed && <NavTooltip label={item.name} visible={tooltip === item.name} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Collapse toggle ─────────────────────── */}
        <div style={{ padding: collapsed ? '12px 6px' : '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: collapsed ? '8px 0' : '8px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#475569',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.14s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.08)';
              el.style.color = '#94A3B8';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'rgba(255,255,255,0.04)';
              el.style.color = '#475569';
            }}
          >
            {collapsed
              ? <ChevronRight size={15} />
              : <><ChevronLeft size={15} /><span>Collapse</span></>
            }
          </button>
        </div>

        {/* ── User footer ─────────────────────────── */}
        <div style={{
          padding: collapsed ? '12px 6px' : '12px 10px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '8px 0' : '8px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            cursor: 'default',
            overflow: 'hidden',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 800, color: '#A5B4FC' }}>D</span>
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Demo User
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#475569', marginTop: 1 }}>
                  demo-org
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
