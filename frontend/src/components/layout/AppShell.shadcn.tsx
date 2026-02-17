import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './Sidebar.shadcn';
import TopNav from './TopNav.shadcn';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--t-bg)' }}>
      {/* ── Sidebar ── */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="animate-fade-in"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
