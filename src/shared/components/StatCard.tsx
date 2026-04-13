import { ReactNode } from 'react';
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
    <div className={cn('bg-card rounded-xl border border-border p-5 flex items-start justify-between', className)}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-display font-bold text-card-foreground">{value}</p>
        {trend && (
          <p className={cn('text-xs font-medium', trendUp ? 'text-success' : 'text-destructive')}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground shrink-0">
        {icon}
      </div>
    </div>
  );
}
