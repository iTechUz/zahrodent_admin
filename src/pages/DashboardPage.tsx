import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/StatCard';
import { Users, CalendarDays, DollarSign, UserPlus, TrendingUp, Activity, Plus, Stethoscope, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { StatusBadge, SourceBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const patientGrowth = [
  { month: 'Yan', patients: 12 }, { month: 'Fev', patients: 19 }, { month: 'Mar', patients: 28 },
  { month: 'Apr', patients: 35 }, { month: 'May', patients: 42 }, { month: 'Iyn', patients: 55 },
];

const revenueData = [
  { month: 'Yan', revenue: 2400000 }, { month: 'Fev', revenue: 3200000 }, { month: 'Mar', revenue: 4100000 },
  { month: 'Apr', revenue: 3800000 }, { month: 'May', revenue: 5200000 }, { month: 'Iyn', revenue: 6100000 },
];

const sourceData = [
  { name: 'Shaxsan', value: 35, color: 'hsl(174, 62%, 38%)' },
  { name: 'Telegram', value: 30, color: 'hsl(210, 80%, 52%)' },
  { name: 'Veb-sayt', value: 20, color: 'hsl(38, 92%, 50%)' },
  { name: 'Telefon', value: 15, color: 'hsl(152, 60%, 40%)' },
];

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

export default function DashboardPage() {
  const { patients, bookings, payments, doctors, visits } = useStore();
  const navigate = useNavigate();
  const todayBookings = bookings.filter((b) => b.date === '2024-03-31');
  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const newPatients = patients.filter((p) => p.createdAt >= '2024-03-01').length;
  const completedToday = todayBookings.filter(b => b.status === 'completed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const unpaidPayments = payments.filter(p => p.status !== 'paid');
  const totalDebt = unpaidPayments.reduce((s, p) => s + p.amount, 0);
  const activeDoctors = doctors.filter(d => visits.some(v => v.doctorId === d.id && v.status === 'in-progress')).length;

  const quickActions = [
    { label: 'Yangi qabul', icon: CalendarDays, path: '/bookings', color: 'bg-primary/10 text-primary' },
    { label: 'Bemor qo\'shish', icon: UserPlus, path: '/patients', color: 'bg-info/10 text-info' },
    { label: 'To\'lov qayd etish', icon: CreditCard, path: '/finance', color: 'bg-success/10 text-success' },
    { label: 'Shifokorlar', icon: Stethoscope, path: '/doctors', color: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Bosh sahifa</h1>
          <p className="text-sm text-muted-foreground mt-1">Zahro Dental klinika boshqaruv tizimiga xush kelibsiz</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Tezkor amallar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color} transition-transform group-hover:scale-110`}>
              <action.icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Statistikalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami bemorlar" value={patients.length} icon={<Users className="w-5 h-5" />} trend="O'tgan oydan 12% ko'p" trendUp />
        <StatCard title="Bugungi qabullar" value={todayBookings.length} icon={<CalendarDays className="w-5 h-5" />} trend={`${completedToday} ta yakunlangan`} trendUp />
        <StatCard title="Daromad" value={`${fmt(totalRevenue)} so'm`} icon={<DollarSign className="w-5 h-5" />} trend="O'tgan oydan 8% ko'p" trendUp />
        <StatCard title="Yangi bemorlar" value={newPatients} icon={<UserPlus className="w-5 h-5" />} trend="Shu oy" trendUp />
      </div>

      {/* Real-time ko'rsatkichlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingBookings}</p>
            <p className="text-xs text-muted-foreground">Kutayotgan qabullar</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{fmt(totalDebt)} <span className="text-sm font-normal text-muted-foreground">so'm</span></p>
            <p className="text-xs text-muted-foreground">{unpaidPayments.length} ta to'lanmagan hisob</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeDoctors} / {doctors.length}</p>
            <p className="text-xs text-muted-foreground">Faol shifokorlar</p>
          </div>
        </div>
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Bemorlar o'sishi</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={patientGrowth}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 62%, 38%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 90%)', fontSize: '12px' }} formatter={(v: number) => [`${v} ta`, 'Bemorlar']} />
              <Area type="monotone" dataKey="patients" stroke="hsl(174, 62%, 38%)" fill="url(#colorPatients)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Daromad dinamikasi</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 90%)', fontSize: '12px' }} formatter={(v: number) => [`${fmt(v)} so'm`, 'Daromad']} />
              <Bar dataKey="revenue" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manba pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Qabul manbalari</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {sourceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {sourceData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name} ({s.value}%)
              </div>
            ))}
          </div>
        </div>

        {/* So'nggi qabullar */}
        <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">So'nggi qabullar</h3>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/bookings')}>
              Barchasini ko'rish
            </Button>
          </div>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => {
              const patient = patients.find((p) => p.id === b.patientId);
              const doctor = doctors.find((d) => d.id === b.doctorId);
              return (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                      {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient?.firstName} {patient?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{doctor?.name} • {b.date} — {b.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SourceBadge source={b.source} />
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
