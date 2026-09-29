import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { 
  Users, 
  CalendarDays, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Stethoscope, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useDashboard } from '../hooks/useDashboard';
import { formatUzS, formatDate } from '@/shared/lib/formatters';
import { DashboardSkeleton } from '@/components/Skeletons';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { CLINIC_TIME_ZONE } from '@/shared/lib/date-utils';

function DashboardPageContent() {
  const {
    totalPatients,
    recentBookings,
    patientsById,
    doctorsById,
    todayBookings,
    monthRevenue,
    totalDoctors,
    newPatients,
    completedToday,
    pendingBookings,
    totalDebt,
    unpaidCount,
    activeDoctors,
    quickActions,
    navigate,
    patientGrowth,
    revenueData,
    sourceData,
    newPatientsTrend,
    revenueTrend,
    canViewPayments,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return <QueryErrorState error={error} onRetry={refetch} title="Bosh sahifa ma'lumotlari yuklanmadi" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Bosh sahifa</h1>
          <p className="text-sm text-muted-foreground mt-1">Zahro Dental klinika boshqaruv tizimi</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long', timeZone: CLINIC_TIME_ZONE })}
        </div>
      </div>

      {/* Tezkor amallar */}
      {quickActions.length > 0 && (
        <div
          className={`grid grid-cols-2 gap-3 ${quickActions.length >= 4 ? 'sm:grid-cols-4' : quickActions.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
        >
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon className="w-4.5 h-4.5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Statistikalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Jami bemorlar" value={totalPatients} icon={<Users className="w-5 h-5" />} />
        <StatCard
          title="Bugungi qabullar"
          value={todayBookings}
          icon={<CalendarDays className="w-5 h-5" />}
          trend={`${completedToday} ta yakunlangan`}
          trendUp={completedToday > 0}
        />
        <StatCard
          title="Daromad (shu oy)"
          value={canViewPayments ? formatUzS(monthRevenue) : '—'}
          icon={<DollarSign className="w-5 h-5" />}
          trend={canViewPayments ? revenueTrend?.text : "Faqat admin ko'radi"}
          trendUp={canViewPayments ? revenueTrend?.up : undefined}
        />
        <StatCard
          title="Yangi bemorlar"
          value={newPatients}
          icon={<CalendarDays className="w-5 h-5" />}
          trend={newPatientsTrend?.text}
          trendUp={newPatientsTrend?.up}
        />
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
            <p className="text-2xl font-bold">
              {canViewPayments ? formatUzS(totalDebt) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {canViewPayments ? `${unpaidCount} ta to'lanmagan hisob` : "To'lovlar — faqat admin"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeDoctors} / {totalDoctors}</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" axisLine={false} tickLine={false} />
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
          {canViewPayments ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 90%)', fontSize: '12px' }} formatter={(v: number) => [formatUzS(v), 'Daromad']} />
                <Bar dataKey="revenue" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-16 text-center">
              Daromad grafigi faqat administrator uchun.
            </p>
          )}
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
                {s.name} — {s.value} ta
              </div>
            ))}
          </div>
        </div>

        {/* So'nggi qabullar */}
        <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">So'nggi qabullar</h3>
            <Button variant="ghost" size="sm" className="text-xs h-7 hover:bg-primary/5 hover:text-primary" onClick={() => navigate('/bookings')}>
              Barchasini ko'rish
            </Button>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Hozircha qabullar yo'q</p>
            )}
            {recentBookings.map((b) => {
              const patient = patientsById.get(b.patientId);
              const doctor = doctorsById.get(b.doctorId);
              return (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/10 transition-colors px-2 -mx-2 rounded-lg cursor-pointer" onClick={() => navigate('/bookings')}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                      {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient?.firstName} {patient?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'} • {formatDate(b.date)} — {b.time}</p>
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

export default function DashboardPage() {
  return (
    <ErrorBoundary name="Dashboard">
      <DashboardPageContent />
    </ErrorBoundary>
  );
}
