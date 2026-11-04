import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  MessageSquare, 
  Pill,
  Settings 
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useStore } from '@/store/useStore';
import { roleAccess } from '@/shared/config/roles';

const mobileNavItems = [
  { title: 'Bosh sahifa', path: '/', icon: LayoutDashboard },
  { title: 'Qabullar', path: '/bookings', icon: CalendarDays },
  { title: 'Bemorlar', path: '/patients', icon: Users },
  { title: 'Apteka', path: '/pharmacy', icon: Pill },
  { title: 'Lidlar', path: '/leads', icon: MessageSquare },
  { title: 'Sozlamalar', path: '/settings', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const { currentUser } = useStore();
  const role = currentUser?.role || 'receptionist';
  const allowedPaths = roleAccess[role];
  
  const navItems = mobileNavItems.filter(
    (item) => allowedPaths.includes(item.path) && !(role === 'pharmacist' && item.path === '/'),
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 md:hidden">
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5', active && 'animate-in zoom-in-75')} />
            <span className="text-[10px] font-medium">{item.title}</span>
            {active && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
