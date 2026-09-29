import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { formatCurrency } from '@/shared/lib/formatters';
import type { ReactNode } from 'react';
import { 
  Users, 
  Target, 
  CreditCard, 
  Award,
  CalendarCheck
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function DoctorEfficiencyStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.doctorsEfficiency,
    queryFn: () => doctorsApi.efficiency(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 rounded-xl bg-card border border-border" />
        ))}
      </div>
    );
  }

  const maxRevenue = Math.max(...(stats?.map(s => s.totalRevenue) || [1]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats?.map((doctor, index) => (
          <div 
            key={doctor.id} 
            className={cn(
              "relative bg-card rounded-2xl border border-border overflow-hidden transition-all hover:shadow-lg",
              index === 0 && "ring-2 ring-primary/20"
            )}
          >
            {/* Top Badge for Rank 1 */}
            {index === 0 && (
              <div className="absolute top-0 right-0 p-3">
                <div className="bg-warning/20 text-warning p-1.5 rounded-full">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {doctor.firstName[0]}{doctor.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none">{doctor.firstName} {doctor.lastName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{doctor.specialty}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatMini 
                  icon={<Users className="w-3.5 h-3.5" />} 
                  label="Bemorlar" 
                  value={doctor.totalVisits} 
                />
                <StatMini 
                  icon={<CalendarCheck className="w-3.5 h-3.5" />} 
                  label="Bronlar" 
                  value={doctor.totalBookings} 
                />
              </div>

              {/* Progress Bars */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Daromad
                    </span>
                    <span className="font-bold text-primary">{formatCurrency(doctor.totalRevenue)}</span>
                  </div>
                  <ProgressBar 
                    value={(doctor.totalRevenue / maxRevenue) * 100} 
                    color="primary" 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" /> Konversiya
                    </span>
                    <span className={cn(
                      "font-bold",
                      doctor.conversionRate > 80 ? "text-success" : 
                      doctor.conversionRate > 50 ? "text-info" : "text-warning"
                    )}>
                      {doctor.conversionRate}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={doctor.conversionRate} 
                    color={doctor.conversionRate > 80 ? "success" : "info"} 
                  />
                </div>
              </div>

              {/* Bottom Divider Metric */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">O'rtacha chek:</span>
                <span className="text-sm font-bold">{formatCurrency(doctor.avgCheck)} UZS</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatMini({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-tight">{label}</span>
      </div>
      <p className="text-sm font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number, color: 'primary' | 'success' | 'info' | 'warning' }) {
  const bgClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    info: 'bg-info',
    warning: 'bg-warning',
  };

  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div 
        className={cn("h-full transition-all duration-500 ease-out", bgClasses[color])} 
        style={{ width: `${Math.max(5, value)}%` }}
      />
    </div>
  );
}
