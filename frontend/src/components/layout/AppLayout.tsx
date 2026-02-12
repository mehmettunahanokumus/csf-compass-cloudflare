/**
 * Main Application Layout
 * Reference-based: Sidebar pushes content, not overlay
 * Layout: Sidebar (240px) | TopNav (56px) + Main Content
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  // Sidebar closed on mobile, open on desktop by default
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  // Update sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Auto-open on desktop
      } else {
        setSidebarOpen(false); // Auto-close on mobile/tablet
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--surface-ground)' }}
    >
      {/* Sidebar - pushes content when open */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right Panel: TopNav + Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Nav - 56px height */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content - scrollable, responsive padding */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6"
          style={{ backgroundColor: 'var(--surface-ground)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
