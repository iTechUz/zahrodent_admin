import { PageHeader } from '@/shared/components/PageHeader';
import { useAnalytics } from '../hooks/useAnalytics';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { 
  GrowthChart, 
  RevenueChart, 
  ConversionChart, 
  SourcePieChart,
  DoctorEfficiencyChart,
  ServiceRevenueHBarChart,
} from '../components/Charts';
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  const {
    colors,
    canViewPayments,
    serviceStats,
    monthlyPatients,
    revenueGrowth,
    conversionData,
    sourceData,
    doctorEfficiency,
    isError,
    error,
    refetch,
  } = useAnalytics();

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tahlillar" description="Klinika samaradorligi va ko'rsatkichlari" />
        <QueryErrorState error={error} onRetry={refetch} title="Tahlil ma'lumotlari yuklanmadi" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tahlillar" 
        description="Klinika samaradorligi va ko'rsatkichlari" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bemorlar o'sishi */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Bemorlar o'sishi</h3>
          </div>
          <GrowthChart data={monthlyPatients} />
        </div>

        {/* Daromad o'sishi */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-success" />
            <h3 className="text-sm font-semibold">Daromad o'sishi (mln so'm)</h3>
          </div>
          {canViewPayments ? (
            <RevenueChart data={revenueGrowth} />
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Daromad ma'lumotlari faqat administrator uchun.
            </p>
          )}
        </div>

        {/* Konversiya */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold">Qabul konversiyasi</h3>
          </div>
          <ConversionChart data={conversionData} />
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(210,80%,52%)' }} />
              Yozilganlar
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(152,60%,40%)' }} />
              Yakunlanganlar
            </div>
          </div>
        </div>

        {/* Manba pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Qabul manbalari</h3>
          <SourcePieChart data={sourceData} colors={colors} />
          <div className="flex flex-wrap gap-3 mt-2">
            {sourceData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ background: colors[i % colors.length] }} 
                />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Shifokorlar samaradorligi — NEW */}
        {canViewPayments && doctorEfficiency.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Shifokorlar samaradorligi</h3>
            </div>
            <DoctorEfficiencyChart data={doctorEfficiency} />
          </div>
        )}

        {/* Xizmatlar daromadi — NEW: horizontal bar chart */}
        {canViewPayments && serviceStats.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-success" />
              <h3 className="text-sm font-semibold">Xizmatlar bo'yicha daromad (TOP-8)</h3>
            </div>
            <ServiceRevenueHBarChart data={serviceStats} />
          </div>
        )}

        {/* Xizmatlar detail cards (fallback if no chart data) */}
        {canViewPayments && serviceStats.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Xizmatlar bo'yicha daromad</h3>
            <p className="text-sm text-muted-foreground py-8 text-center">
              Ma'lumotlar mavjud emas.
            </p>
          </div>
        )}

        {!canViewPayments && (
          <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Xizmatlar bo'yicha daromad</h3>
            <p className="text-sm text-muted-foreground py-8 text-center">
              Faqat administrator uchun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
