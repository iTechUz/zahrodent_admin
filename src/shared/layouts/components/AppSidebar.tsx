import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, Stethoscope,
  DollarSign, BarChart3, Bell, Settings, ChevronLeft, Sparkles, ClipboardList,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useStore } from '@/store/useStore';
import { roleAccess } from '@/mock/users';
import { Badge } from '@/components/ui/badge';
import { roleConfig } from '@/mock/users';
import { useIsMobile } from '@/shared/hooks/use-mobile';

const allNavItems = [
  { title: 'Bosh sahifa', path: '/', icon: LayoutDashboard },
  { title: 'Qabullar', path: '/bookings', icon: CalendarDays },
  { title: 'Bemorlar', path: '/patients', icon: Users },
  { title: 'Shifokorlar', path: '/doctors', icon: Stethoscope },
  { title: 'Xizmatlar', path: '/services', icon: ClipboardList },
  { title: 'Moliya', path: '/finance', icon: DollarSign },
  { title: 'Tahlillar', path: '/analytics', icon: BarChart3 },
  { title: 'Bildirishnomalar', path: '/notifications', icon: Bell },
  { title: 'Sozlamalar', path: '/settings', icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { currentUser } = useStore();
  const role = currentUser?.role || 'receptionist';
  const allowedPaths = roleAccess[role];
  const navItems = allNavItems.filter((item) => allowedPaths.includes(item.path));
  const isMobile = useIsMobile();

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        isMobile ? 'w-full' : 'fixed left-0 top-0 z-40',
        !isMobile && (collapsed ? 'w-[68px]' : 'w-[240px]')
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-sm text-sidebar-primary-foreground leading-tight truncate">Zahro Dental</h1>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Boshqaruv tizimi</p>
          </div>
        )}
      </div>

      {/* Foydalanuvchi ma'lumotlari */}
      {(!collapsed || isMobile) && currentUser && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{currentUser.name}</p>
              <Badge variant="outline" className={cn('text-[9px] px-1 py-0 h-3.5 border', roleConfig[currentUser.role].color)}>
                {roleConfig[currentUser.role].label}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigatsiya */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={isMobile ? onToggle : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', active && 'text-sidebar-primary')} />
              {(!collapsed || isMobile) && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Yig'ish tugmasi - faqat desktopda */}
      {!isMobile && (
        <div className="p-2 border-t border-sidebar-border shrink-0">
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>
      )}
    </aside>
  );
}
