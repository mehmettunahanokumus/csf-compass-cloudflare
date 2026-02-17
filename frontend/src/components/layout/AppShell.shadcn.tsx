import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import AppSidebar from './Sidebar.shadcn';
import TopNav from './TopNav.shadcn';

export default function AppShell() {
  return (
    <SidebarProvider style={{ '--sidebar-width': '248px' } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="!bg-[#08090E] min-h-screen">
        <TopNav />
        <div className="flex-1 overflow-auto animate-fade-in">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
