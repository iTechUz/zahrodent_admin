import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line } from 'recharts';

const monthlyPatients = [
  { month: 'Yan', count: 12 }, { month: 'Fev', count: 19 }, { month: 'Mar', count: 28 },
  { month: 'Apr', count: 35 }, { month: 'May', count: 42 }, { month: 'Iyn', count: 55 },
];

const revenueGrowth = [
  { month: 'Yan', revenue: 2.4 }, { month: 'Fev', revenue: 3.2 }, { month: 'Mar', revenue: 4.1 },
  { month: 'Apr', revenue: 3.8 }, { month: 'May', revenue: 5.2 }, { month: 'Iyn', revenue: 6.1 },
];

const conversionData = [
  { month: 'Yan', booked: 20, completed: 15 }, { month: 'Fev', booked: 28, completed: 22 },
  { month: 'Mar', booked: 35, completed: 30 }, { month: 'Apr', booked: 40, completed: 33 },
  { month: 'May', booked: 48, completed: 40 }, { month: 'Iyn', booked: 55, completed: 48 },
];

const sourceLabels: Record<string, string> = {
  'walk-in': 'Shaxsan', telegram: 'Telegram', website: 'Veb-sayt', phone: 'Telefon',
};

export default function AnalyticsPage() {
  const { bookings } = useStore();
  const sourceCount = bookings.reduce((acc, b) => { acc[b.source] = (acc[b.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const sourceData = Object.entries(sourceCount).map(([name, value]) => ({ name: sourceLabels[name] || name, value }));
  const colors = ['hsl(174, 62%, 38%)', 'hsl(210, 80%, 52%)', 'hsl(38, 92%, 50%)', 'hsl(152, 60%, 40%)'];

  return (
    <div className="space-y-6">
      <PageHeader title="Tahlillar" description="Klinika samaradorligi va ko'rsatkichlari" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Bemorlar o'sishi</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyPatients}>
              <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(174,62%,38%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(174,62%,38%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v} ta`, 'Bemorlar']} />
              <Area type="monotone" dataKey="count" stroke="hsl(174,62%,38%)" fill="url(#gp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Daromad o'sishi (mln so'm)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v} mln so'm`, 'Daromad']} />
              <Bar dataKey="revenue" fill="hsl(174,62%,38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Qabul konversiyasi</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="booked" stroke="hsl(210,80%,52%)" strokeWidth={2} dot={{ r: 3 }} name="Yozilganlar" />
              <Line type="monotone" dataKey="completed" stroke="hsl(152,60%,40%)" strokeWidth={2} dot={{ r: 3 }} name="Yakunlanganlar" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: 'hsl(210,80%,52%)' }} />Yozilganlar</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: 'hsl(152,60%,40%)' }} />Yakunlanganlar</div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Qabul manbalari</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {sourceData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {sourceData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />{s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
