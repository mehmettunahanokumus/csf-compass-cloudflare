import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  Plus,
  Shield,
} from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

const navLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Assessments', path: '/assessments', icon: FileCheck },
  { name: 'Vendors', path: '/vendors', icon: Building2 },
];

export default function TopNav() {
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      {/* Hamburger trigger - visible on mobile only */}
      <SidebarTrigger className="md:hidden" />
      <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

      {/* Logo - visible on mobile only (desktop has sidebar logo) */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 md:hidden"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold">CSF Compass</span>
      </Link>

      {/* Desktop nav links - visible on lg+ screens */}
      <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer on mobile */}
      <div className="flex-1 lg:hidden" />

      {/* New Assessment button */}
      <Button asChild size="sm">
        <Link to="/assessments/new">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Assessment</span>
        </Link>
      </Button>
    </header>
  );
}
