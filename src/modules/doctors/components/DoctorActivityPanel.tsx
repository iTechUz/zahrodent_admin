import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { CalendarCheck, CalendarClock, CalendarX, CheckCircle2, ClipboardList, Search, UserCheck, UserX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bookingsApi, patientsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '@/shared/constants';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { formatDate } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/utils';
import type { Booking, BookingStatus, Patient } from '@/shared/types';

const STATUS_ICONS: Record<BookingStatus, typeof CalendarClock> = {
  pending: CalendarClock,
  confirmed: CalendarCheck,
  arrived: UserCheck,
  'no-show': UserX,
  completed: CheckCircle2,
  cancelled: CalendarX,
};

function Pager({ page, totalPages, total, noun, onPage }: { page: number; totalPages: number; total: number; noun: string; onPage: (p: number) => void }) {
  if (totalPages <= 1) return <p className="text-xs text-muted-foreground px-1 pt-3">Jami: {total} ta {noun}</p>;
  return (
    <div className="flex items-center justify-between pt-3">
      <p className="text-xs text-muted-foreground">Jami: {total} ta {noun}</p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}>
          Oldingi
        </Button>
        <div className="flex items-center px-4 text-sm font-medium">
          {page + 1} / {totalPages}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
          Keyingi
        </Button>
      </div>
    </div>
  );
}

/** Everything that belongs to one doctor: booking counters per status, the bookings and the patients. */
export function DoctorActivityPanel({ doctorId }: { doctorId: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('bookings');

  const bookingsTable = useServerTable<Booking, { status?: string }>({
    queryKey: [...queryKeys.bookings, 'doctor', doctorId],
    fetchFn: (params) => bookingsApi.list({ ...params, doctorId }),
    initialFilters: {},
    initialSort: { sortBy: 'date', order: 'desc' },
    perPage: 10,
  });
  const patientsTable = useServerTable<Patient, object>({
    queryKey: [...queryKeys.patients, 'doctor', doctorId],
    fetchFn: (params) => patientsApi.list({ ...params, relatedDoctorId: doctorId }),
    perPage: 10,
  });

  // one cheap request per status (limit 1 — only `total` is used); first entry = all statuses
  const counters = useQueries({
    queries: [undefined, ...BOOKING_STATUSES].map((status) => ({
      queryKey: [...queryKeys.bookings, 'doctor', doctorId, 'count', status ?? 'all'],
      queryFn: () => bookingsApi.list({ doctorId, status, limit: 1, page: 0 }),
      select: (r: { total: number }) => r.total,
    })),
  });
  const total = counters[0]?.data ?? 0;
  const byStatus = (i: number) => counters[i + 1]?.data ?? 0;
  const activeStatus = (bookingsTable.filters.status ?? 'all') as BookingStatus | 'all';

  const bookingColumns: Column<Booking>[] = [
    { header: 'Sana', accessor: (b) => `${formatDate(b.date)} ${b.time ?? ''}`.trim(), sortKey: 'date', className: 'whitespace-nowrap text-xs' },
    {
      header: 'Bemor',
      accessor: (b) =>
        b.patient ? (
          <button type="button" className="font-medium text-left hover:underline" onClick={() => navigate(`/patients/${b.patientId}`)}>
            <PatientNameLabel patient={b.patient} />
          </button>
        ) : (
          '—'
        ),
    },
    { header: 'Holat', accessor: (b) => <StatusBadge status={b.status} />, sortKey: 'status' },
    { header: 'Izoh', accessor: (b) => <span className="text-xs text-muted-foreground truncate max-w-[220px] block">{b.notes || '—'}</span> },
  ];
  const patientColumns: Column<Patient>[] = [
    {
      header: 'Bemor',
      accessor: (p) => (
        <button type="button" className="font-medium text-left hover:underline" onClick={() => navigate(`/patients/${p.id}`)}>
          {p.firstName} {p.lastName}
        </button>
      ),
    },
    { header: 'Telefon', accessor: 'phone', className: 'whitespace-nowrap text-xs' },
    { header: "Qo'shilgan", accessor: (p) => formatDate(p.createdAt), className: 'text-xs whitespace-nowrap' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <button type="button" className="text-left" onClick={() => { bookingsTable.setFilters('status', undefined); setTab('bookings'); }} aria-pressed={activeStatus === 'all'}>
          <StatCard
            title="Jami qabullar"
            value={total}
            icon={<ClipboardList className="w-5 h-5 text-primary" />}
            className={cn('border-none shadow-md', activeStatus === 'all' && 'ring-2 ring-primary/40')}
          />
        </button>
        {BOOKING_STATUSES.map((s, i) => {
          const Icon = STATUS_ICONS[s];
          return (
            <button key={s} type="button" className="text-left" onClick={() => { bookingsTable.setFilters('status', s); setTab('bookings'); }} aria-pressed={activeStatus === s}>
              <StatCard
                title={BOOKING_STATUS_LABELS[s]}
                value={byStatus(i)}
                icon={<Icon className="w-5 h-5" />}
                className={cn('border-none shadow-md', activeStatus === s && 'ring-2 ring-primary/40')}
              />
            </button>
          );
        })}
      </div>

      <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Shifokorga biriktirilgan ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="bookings" className="gap-2">
                <CalendarCheck className="w-4 h-4" /> Qabullar ({total})
              </TabsTrigger>
              <TabsTrigger value="patients" className="gap-2">
                <Users className="w-4 h-4" /> Bemorlar ({patientsTable.totalCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-2">
              {activeStatus !== 'all' && (
                <p className="text-xs text-muted-foreground">
                  Filtr: <b>{BOOKING_STATUS_LABELS[activeStatus]}</b>{' '}
                  <button type="button" className="underline" onClick={() => bookingsTable.setFilters('status', undefined)}>
                    tozalash
                  </button>
                </p>
              )}
              {bookingsTable.error ? (
                <QueryErrorState error={bookingsTable.error} onRetry={() => bookingsTable.refetch()} />
              ) : (
                <DataTable
                  data={bookingsTable.data}
                  columns={bookingColumns}
                  isLoading={bookingsTable.isLoading}
                  sort={bookingsTable.sort}
                  onSortChange={bookingsTable.setSort}
                />
              )}
              <Pager page={bookingsTable.page} totalPages={bookingsTable.totalPages} total={bookingsTable.totalCount} noun="qabul" onPage={bookingsTable.setPage} />
            </TabsContent>

            <TabsContent value="patients" className="space-y-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Bemor qidirish..." className="pl-9 h-10" value={patientsTable.search} onChange={(e) => patientsTable.setSearch(e.target.value)} />
              </div>
              {patientsTable.error ? (
                <QueryErrorState error={patientsTable.error} onRetry={() => patientsTable.refetch()} />
              ) : (
                <DataTable data={patientsTable.data} columns={patientColumns} isLoading={patientsTable.isLoading} />
              )}
              <Pager page={patientsTable.page} totalPages={patientsTable.totalPages} total={patientsTable.totalCount} noun="bemor" onPage={patientsTable.setPage} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
