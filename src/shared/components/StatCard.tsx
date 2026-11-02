import { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-4 sm:p-5 flex items-start justify-between premium-shadow hover:glow transition-all duration-300', className)}>
      <div className="space-y-1 sm:space-y-2 min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-xl sm:text-2xl font-display font-bold text-card-foreground tabular-nums">{value}</p>
        {trend && (
          <p
            className={cn(
              'text-xs font-medium flex items-center gap-1',
              trendUp === undefined ? 'text-muted-foreground' : trendUp ? 'text-success' : 'text-destructive',
            )}
          >
            {trendUp !== undefined && (trendUp ? <TrendingUp className="w-3.5 h-3.5" aria-hidden /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden />)}
            <span>{trend}</span>
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground shrink-0">
        {icon}
      </div>
    </div>
  );
}
