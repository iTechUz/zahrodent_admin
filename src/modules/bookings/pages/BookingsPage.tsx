import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { DraggableBookingCalendar } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, List, CalendarDays, Clock, CheckCircle2, AlertCircle, Download, CalendarCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BOOKING_STATUSES, BOOKING_SOURCES, BOOKING_STATUS_LABELS, BOOKING_SOURCE_LABELS } from '@/shared/constants';
import { useEffect, useState } from 'react';
import { useBookings } from '../hooks/useBookings';
import {
  CancelReasonDialog,
  StatusHistoryDialog,
  StatusConfirmDialog,
  COMPLETE_NEEDS_SERVICE,
  canCompleteBooking,
  needsStatusConfirm,
} from '../components/BookingStatusDialogs';
import { TodayBookings } from '../components/TodayBookings';
import type { BookingStatus } from '@/shared/types';
import { BookingForm, BookingDetails } from '../components/BookingForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { useCan } from '@/shared/hooks/usePermissions';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { Booking } from '@/shared/types';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/lib/formatters';
import { clinicPeriodRange } from '@/shared/lib/date-utils';
import { StatCard } from '@/shared/components/StatCard';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { resolvePatientRef } from '@/shared/lib/patient-ref';
import { StatsSkeleton } from '@/components/Skeletons';
import { sortBy } from '@/lib/api/sort-fields';
import { bookingsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { exportToExcel } from '@/shared/lib/excel';
import { clinicToday } from '@/shared/lib/date-utils';
import { normalizeSearch } from '@/shared/lib/formatters';
import { patientRefLabel } from '@/shared/lib/patient-ref';

function BookingsPageContent() {
  const {
    bookings,
    totalBookings,
    doctors,
    search,
    setSearch,
    filters,
    setFilters,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    viewBooking,
    setViewBooking,
    page,
    setPage,
    totalPages,
    openCreate,
    openEdit,
    handleDelete,
    handleStatusChange,
    handleSave,
    isSaving,
    isLoading,
    error,
    refetch,
    sort,
    setSort,
    stats,
    services,
  } = useBookings();

  const can = useCan();
  const canCreate = can('bookings.create');
  const canUpdate = can('bookings.update');
  const canDelete = can('bookings.delete');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ booking: Booking; to: BookingStatus } | null>(null);
  /** patient preselected in the create dialog (?new=1&patientId=… from the patient profile) */
  const [initialPatientId, setInitialPatientId] = useState<string | undefined>();

  /** Every status change goes through here: guard → cancel reason / confirm → mutation (with undo toast). */
  const changeStatus = (b: Booking, to: BookingStatus) => {
    if (to === b.status) return;
    if (to === 'cancelled') return setCancelTarget(b);
    if (to === 'completed' && !canCompleteBooking(b)) {
      toast.error(COMPLETE_NEEDS_SERVICE);
      return;
    }
    if (needsStatusConfirm(b.status, to)) return setPendingStatus({ booking: b, to });
    handleStatusChange(b.id, to, undefined, b.status);
  };

  const startCreate = () => {
    setInitialPatientId(undefined);
    openCreate();
  };

  // deep links: /bookings?new=1[&patientId=…] opens the create form, /bookings?booking=ID opens that booking
  const [searchParams, setSearchParams] = useSearchParams();
  const wantsNew = searchParams.get('new') === '1';
  const newPatientId = searchParams.get('patientId') ?? undefined;
  const deepBookingId = searchParams.get('booking');
  useEffect(() => {
    if (!wantsNew) return;
    if (canCreate) {
      setInitialPatientId(newPatientId);
      openCreate();
    }
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsNew]);
  const { data: deepBooking } = useQuery({
    queryKey: queryKeys.booking(deepBookingId ?? ''),
    queryFn: () => bookingsApi.get(deepBookingId!),
    enabled: !!deepBookingId,
  });
  useEffect(() => {
    if (!deepBookingId || !deepBooking) return;
    setViewBooking(deepBooking);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepBookingId, deepBooking]);

  const [isExporting, setIsExporting] = useState(false);
  /** Excel of the current filtered list (every page; status/source "all" are not filters) */
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const { status, source, dateRange, startDate, endDate, doctorId } = filters;
      const res = await fetchAllPages(bookingsApi.list, {
        ...(status && status !== 'all' ? { status } : {}),
        ...(source && source !== 'all' ? { source } : {}),
        ...(dateRange && dateRange !== 'all' ? { dateRange } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(doctorId ? { doctorId } : {}),
        search: normalizeSearch(search),
        ...(sort.sortBy ? { sortBy: sort.sortBy, order: sort.order } : {}),
      });
      const rows = res.data.map((b) => {
        const d = doctors.find((doc) => doc.id === b.doctorId);
        return {
          'Sana': formatDate(b.date),
          'Vaqt': b.time,
          'Bemor': patientRefLabel(resolvePatientRef(b)),
          'Shifokor': d ? `Dr. ${d.firstName} ${d.lastName}` : '—',
          'Manba': BOOKING_SOURCE_LABELS[b.source] ?? b.source,
          'Holat': BOOKING_STATUS_LABELS[b.status] ?? b.status,
          'Izoh': b.notes ?? '',
        };
      });
      await exportToExcel(rows, `Qabullar_${clinicToday()}`, 'Qabullar');
      toast.success('Excel fayl tayyorlandi');
    } catch {
      toast.error('Eksport qilishda xatolik yuz berdi');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<Booking>[] = [
    { 
      header: 'Bemor', 
      accessor: (b) => (
        <Link to={`/patients/${b.patientId}`} className="font-medium text-primary hover:underline">
          <PatientNameLabel patient={resolvePatientRef(b)} />
        </Link>
      )
    },
    { 
      header: 'Shifokor', 
      accessor: (b) => {
        const d = doctors.find(doctor => doctor.id === b.doctorId);
        return <span className="text-muted-foreground hidden sm:inline">{d ? `Dr. ${d.firstName} ${d.lastName}` : '—'}</span>;
      },
      className: 'hidden sm:table-cell'
    },
    { 
      header: 'Sana/Vaqt', 
      sortKey: sortBy('bookings', 'date'),
      accessor: (b) => <span className="text-muted-foreground">{formatDate(b.date)} {b.time}</span> 
    },
    { 
      header: 'Manba', 
      accessor: (b) => <SourceBadge source={b.source} />,
      className: 'hidden md:table-cell',
      sortKey: sortBy('bookings', 'source'),
    },
    { 
      header: 'Holat', 
      sortKey: sortBy('bookings', 'status'),
      accessor: (b) => !canUpdate ? (
        <StatusBadge status={b.status} />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <StatusBadge status={b.status} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {BOOKING_STATUSES.map((s) => {
              const blocked = s === 'completed' && !canCompleteBooking(b);
              return (
                <DropdownMenuItem
                  key={s}
                  disabled={blocked}
                  title={blocked ? COMPLETE_NEEDS_SERVICE : undefined}
                  onClick={() => changeStatus(b, s)}
                >
                  {BOOKING_STATUS_LABELS[s]}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem onClick={() => setHistoryId(b.id)} className="border-t border-border text-muted-foreground">
              Holat tarixi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Qabullar" 
        description="Qabullar va uchrashuvlarni boshqarish" 
        action={canCreate && (
          <Button onClick={startCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Yangi qabul
          </Button>
        )} 
      />

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <StatCard 
            title="Bugungi qabullar" 
            value={stats?.today ?? 0} 
            icon={<Clock className="w-5 h-5 text-primary" />} 
            trend="Bugun uchun jami"
          />
          <StatCard 
            title="Kutilmoqda" 
            value={stats?.pending ?? 0} 
            icon={<AlertCircle className="w-5 h-5 text-warning" />} 
            trend="Tasdiqlanishi kerak"
          />
          <StatCard 
            title="Bugun yakunlandi" 
            value={stats?.completedToday ?? 0} 
            icon={<CheckCircle2 className="w-5 h-5 text-success" />} 
            trend="Muvaffaqiyatli qabullar"
            trendUp={true}
          />
        </div>
      )}

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="today" className="gap-2"><CalendarCheck className="w-4 h-4" />Bugun</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />Ro'yxat</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="w-4 h-4" />Kalendar</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <TodayBookings
            doctors={doctors}
            canUpdate={canUpdate}
            onRequestStatus={changeStatus}
            onOpen={setViewBooking}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Bemor qidirish..." 
                className="pl-9 h-10" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border h-10">
              <Input 
                type="date" 
                className="w-[140px] h-8 text-xs border-none bg-transparent" 
                value={filters.startDate || ''} 
                onChange={(e) => {
                  setFilters('startDate', e.target.value || undefined);
                  setFilters('dateRange', 'all');
                }}
              />
              <span className="text-muted-foreground text-xs">—</span>
              <Input 
                type="date" 
                className="w-[140px] h-8 text-xs border-none bg-transparent" 
                value={filters.endDate || ''} 
                onChange={(e) => {
                  setFilters('endDate', e.target.value || undefined);
                  setFilters('dateRange', 'all');
                }}
              />
            </div>

            <Select 
              value={filters.dateRange || 'all'} 
              onValueChange={(val) => {
                setFilters('dateRange', val);
                // keep the date pickers in sync with the chosen period
                const range = val === 'all' ? undefined : clinicPeriodRange(val as 'today' | 'week' | 'month');
                setFilters('startDate', range?.startDate);
                setFilters('endDate', range?.endDate);
              }}
            >
              <SelectTrigger className="w-[160px] h-10">
                <CalendarDays className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Vaqt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha vaqtlar</SelectItem>
                <SelectItem value="today">Bugun</SelectItem>
                <SelectItem value="week">Shu hafta</SelectItem>
                <SelectItem value="month">Shu oy</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(val) => setFilters('status', val)}
            >
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.doctorId || 'all'}
              onValueChange={(val) => setFilters('doctorId', val === 'all' ? undefined : val)}
            >
              <SelectTrigger className="w-[190px]" aria-label="Shifokor"><SelectValue placeholder="Shifokor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha shifokorlar</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={filters.source || 'all'} 
              onValueChange={(val) => setFilters('source', val)}
            >
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Manba" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha manbalar</SelectItem>
                {BOOKING_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10" onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              Excel'ga yuklash
            </Button>
          </div>

          {error && !isLoading ? (
            <QueryErrorState error={error} onRetry={() => refetch()} title="Qabullar yuklanmadi" />
          ) : (
            <DataTable
              data={bookings}
              columns={columns}
              onView={setViewBooking}
              onEdit={canUpdate ? openEdit : undefined}
              onDelete={canDelete ? setDeleteId : undefined}
              isLoading={isLoading}
              sort={sort}
              onSortChange={setSort}
            />
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl border-x">
              <p className="text-xs text-muted-foreground">Jami: {totalBookings} ta qabul</p>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Oldingi
                </Button>
                <div className="flex items-center px-4 text-sm font-medium">
                  {page + 1} / {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                >
                  Keyingi
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <DraggableBookingCalendar onEdit={canUpdate ? openEdit : undefined} />
        </TabsContent>
      </Tabs>

      <BookingForm 
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        doctors={doctors}
        services={services}
        initialPatientId={initialPatientId}
        onSave={handleSave}
        isPending={isSaving}
      />

      <BookingDetails 
        booking={viewBooking}
        onClose={() => setViewBooking(null)}
        doctors={doctors}
        onEdit={canUpdate ? openEdit : undefined}
      />

      <CancelReasonDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        onConfirm={(reason) => {
          if (cancelTarget) handleStatusChange(cancelTarget.id, 'cancelled', reason, cancelTarget.status);
          setCancelTarget(null);
        }}
      />
      <StatusConfirmDialog
        change={pendingStatus ? { from: pendingStatus.booking.status, to: pendingStatus.to } : null}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) handleStatusChange(pendingStatus.booking.id, pendingStatus.to, undefined, pendingStatus.booking.status);
          setPendingStatus(null);
        }}
      />
      <StatusHistoryDialog bookingId={historyId} onClose={() => setHistoryId(null)} />

      <ConfirmDeleteDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
      />
    </div>
  );
}
export default function BookingsPage() {
  return (
    <ErrorBoundary name="Bandlovlar">
      <BookingsPageContent />
    </ErrorBoundary>
  );
}
