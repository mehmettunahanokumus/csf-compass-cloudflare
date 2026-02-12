/**
 * AppShell - Rebuilt for new layout
 * Desktop: Full width, no sidebar, fixed TopNav
 * Mobile: Slide-out sidebar drawer
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarNew from './Sidebar.new';
import TopNavNew from './TopNav.new';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ground)' }}>
      {/* Fixed TopNav */}
      <TopNavNew onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Mobile sidebar drawer */}
      <SidebarNew isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area - offset by topnav height */}
      <main
        style={{
          paddingTop: 'var(--topnav-h)',
          minHeight: '100vh',
          background: 'var(--ground)',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '28px 1rem',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
