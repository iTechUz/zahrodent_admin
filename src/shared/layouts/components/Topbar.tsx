import { Bell, Moon, Sun, User, LogOut, Settings, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { roleAccess, roleConfig } from '@/shared/config/roles';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useLogout } from '@/hooks/useLogout';

export function Topbar() {
  const { darkMode, toggleDarkMode, currentUser } = useStore();
  const authed = useStore((s) => s.isAuthenticated);
  const logout = useLogout();
  // GET /notifications is allowed for every role (doctor: own only); the page itself is admin/receptionist
  const { data: notificationsRes } = useQuery({
    queryKey: queryKeys.notificationsList({}),
    queryFn: () => notificationsApi.list(),
    enabled: authed,
    meta: { silentError: true },
  });
  const unread = (notificationsRes?.data ?? []).filter((n) => n.status === 'sent').length;
  const navigate = useNavigate();
  const canOpenNotifications = !!currentUser && roleAccess[currentUser.role].includes('/notifications');
  const openNotifications = () => {
    if (canOpenNotifications) navigate('/notifications');
  };
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    toast.success('Tizimdan muvaffaqiyatli chiqdingiz');
  };

  if (isMobile) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        {currentUser && (
          <Badge variant="outline" className={cn('text-[10px] hidden xs:inline-flex', roleConfig[currentUser.role].color)}>
            {roleConfig[currentUser.role].label}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={openNotifications} disabled={!canOpenNotifications}>
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {unread}
            </Badge>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.phone}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" /> Sozlamalar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">
          Xush kelibsiz, <span className="text-foreground font-semibold">{currentUser?.name || 'Foydalanuvchi'}</span>
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Qidirish...</span>
          <kbd className="text-[10px] px-1 py-0.5 rounded bg-muted font-mono">⌘K</kbd>
        </button>
        {currentUser && (
          <Badge variant="outline" className={cn('text-xs mr-1', roleConfig[currentUser.role].color)}>
            {roleConfig[currentUser.role].label}
          </Badge>
        )}
        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="relative">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative" onClick={openNotifications} disabled={!canOpenNotifications}>
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {unread}
            </Badge>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.phone}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" /> Sozlamalar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
