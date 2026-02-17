import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  BarChart3,
  FileDown,
  Settings,
  User,
  Shield,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '../ui/sidebar';

const navSections = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Assessments', path: '/assessments', icon: FileCheck },
      { name: 'Vendors', path: '/vendors', icon: Building2 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Exports', path: '/exports', icon: FileDown },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Organization', path: '/organization', icon: Settings },
      { name: 'Profile', path: '/profile', icon: User },
    ],
  },
];

export default function AppSidebar() {
  return (
    <Sidebar className="!bg-[#07080D] !border-r !border-white/[0.06]">
      {/* Brand header */}
      <SidebarHeader className="!p-0">
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[#F0F0F5] tracking-wide">CSF Compass</div>
              <div className="font-mono text-[9px] text-amber-500/60 tracking-[0.2em] uppercase">CIPHER v2.0</div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation groups */}
      <SidebarContent className="!p-0 !py-2">
        {navSections.map((section) => (
          <div key={section.label} className="px-2">
            <div className="px-3 pt-5 pb-1.5">
              <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-[#55576A]">
                {section.label}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-2.5 px-[9px] py-2 rounded-lg text-sm font-sans bg-amber-500/[0.08] text-amber-400 border-l-[3px] border-amber-500 transition-colors'
                      : 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans text-[#8E8FA8] hover:bg-white/[0.04] hover:text-[#F0F0F5] transition-colors'
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="!p-0">
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="font-display text-[10px] font-bold text-amber-400">D</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-sans font-medium text-[#F0F0F5] truncate">Demo User</div>
              <div className="text-[10px] font-mono text-[#55576A] truncate">demo-org-123</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
