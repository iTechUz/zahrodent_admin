import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/shared/layouts/components/AppSidebar';
import { Topbar } from '@/shared/layouts/components/Topbar';
import { cn } from '@/shared/lib/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PageFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
  </div>
);

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[260px]">
            <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <Topbar />
        </header>
        <main className="flex-1 p-4 overflow-auto animate-fade-in">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn('flex-1 flex flex-col transition-all duration-300', collapsed ? 'ml-[68px]' : 'ml-[240px]')}>
        <Topbar />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
