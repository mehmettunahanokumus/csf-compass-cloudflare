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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '../ui/sidebar';

const navSections = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Assessments', path: '/assessments', icon: FileCheck },
      { name: 'Vendors', path: '/vendors', icon: Building2 },
    ],
  },
  {
    label: 'Reports',
    items: [
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      { name: 'Exports', path: '/exports', icon: FileDown },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Organization', path: '/organization', icon: Settings },
      { name: 'Profile', path: '/profile', icon: User },
    ],
  },
];

export default function AppSidebar() {
  return (
    <Sidebar>
      {/* Brand header */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-semibold">CSF Compass</span>
            <p className="text-xs text-muted-foreground">NIST CSF 2.0</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation groups */}
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <NavLink to={item.path}>
                      {({ isActive }) => (
                        <SidebarMenuButton isActive={isActive} tooltip={item.name}>
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      {/* User footer */}
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
            <span className="text-xs font-medium">JD</span>
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">John Doe</p>
            <p className="truncate text-xs text-muted-foreground">Security Admin</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
