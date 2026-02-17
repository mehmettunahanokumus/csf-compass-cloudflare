import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';

const pathTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/assessments': 'Assessments',
  '/assessments/new': 'New Assessment',
  '/vendors': 'Vendors',
  '/analytics': 'Analytics',
  '/exports': 'Exports',
  '/organization': 'Organization',
  '/profile': 'Profile',
};

function getPageTitle(pathname: string): string {
  if (pathTitles[pathname]) return pathTitles[pathname];
  if (pathname.startsWith('/assessments/')) return 'Assessment Detail';
  if (pathname.startsWith('/vendors/')) return 'Vendor Detail';
  return 'Dashboard';
}

export default function TopNav() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="flex h-[60px] items-center gap-4 border-b border-white/[0.06] bg-[rgba(8,9,14,0.92)] backdrop-blur-md px-4">
      {/* Hamburger trigger - visible on mobile only */}
      <SidebarTrigger className="md:hidden text-[#8E8FA8] hover:text-[#F0F0F5]" />

      {/* Mobile logo */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 md:hidden"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-amber-500" />
        </div>
      </Link>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1.5 text-sm">
        <span className="font-sans text-[#55576A]">CSF Compass</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#55576A]" />
        <span className="font-display font-semibold text-[#F0F0F5]">{pageTitle}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg border border-white/[0.07] bg-white/[0.03] flex items-center justify-center text-[#8E8FA8] hover:text-[#F0F0F5] hover:border-amber-500/30 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="font-display text-xs font-bold text-amber-400">D</span>
        </div>
      </div>
    </header>
  );
}
