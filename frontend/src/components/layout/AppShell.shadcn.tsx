import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import AppSidebar from './Sidebar.shadcn';
import TopNav from './TopNav.shadcn';

export default function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNav />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
