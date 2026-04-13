import { PageHeader } from '@/shared/components/PageHeader';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
  GrowthChart, 
  RevenueChart, 
  ConversionChart, 
  SourcePieChart 
} from '../components/Charts';

export default function AnalyticsPage() {
  const {
    monthlyPatients,
    revenueGrowth,
    conversionData,
    sourceData,
    colors
  } = useAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tahlillar" 
        description="Klinika samaradorligi va ko'rsatkichlari" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Bemorlar o'sishi</h3>
          <GrowthChart data={monthlyPatients} />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Daromad o'sishi (mln so'm)</h3>
          <RevenueChart data={revenueGrowth} />
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Qabul konversiyasi</h3>
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
      </div>
    </div>
  );
}
