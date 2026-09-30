import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { DraggableBookingCalendar } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, List, CalendarDays, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BOOKING_STATUSES, BOOKING_SOURCES, BOOKING_STATUS_LABELS, BOOKING_SOURCE_LABELS } from '@/shared/constants';
import { useBookings } from '../hooks/useBookings';
import { BookingForm, BookingDetails } from '../components/BookingForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { useCan } from '@/shared/hooks/usePermissions';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { Booking } from '@/shared/types';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/lib/formatters';
import { StatCard } from '@/shared/components/StatCard';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { resolvePatientRef } from '@/shared/lib/patient-ref';
import { StatsSkeleton } from '@/components/Skeletons';
import { sortBy } from '@/lib/api/sort-fields';

function BookingsPageContent() {
  const {
    bookings,
    totalBookings,
    patients,
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

  const columns: Column<Booking>[] = [
    { 
      header: 'Bemor', 
      accessor: (b) => <PatientNameLabel className="font-medium" patient={resolvePatientRef(b, patients)} />
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
            {BOOKING_STATUSES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => handleStatusChange(b.id, s)}>
                {BOOKING_STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
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
          <Button onClick={openCreate}>
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

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />Ro'yxat</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="w-4 h-4" />Kalendar</TabsTrigger>
        </TabsList>

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
                onChange={(e) => setFilters('startDate', e.target.value || undefined)}
              />
              <span className="text-muted-foreground text-xs">—</span>
              <Input 
                type="date" 
                className="w-[140px] h-8 text-xs border-none bg-transparent" 
                value={filters.endDate || ''} 
                onChange={(e) => setFilters('endDate', e.target.value || undefined)}
              />
            </div>

            <Select 
              value={filters.dateRange || 'all'} 
              onValueChange={(val) => {
                setFilters('dateRange', val);
                if (val !== 'all') {
                  setFilters('startDate', undefined);
                  setFilters('endDate', undefined);
                }
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
          <DraggableBookingCalendar />
        </TabsContent>
      </Tabs>

      <BookingForm 
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        patients={patients}
        doctors={doctors}
        services={services}
        onSave={handleSave}
      />

      <BookingDetails 
        booking={viewBooking}
        onClose={() => setViewBooking(null)}
        patients={patients}
        doctors={doctors}
      />

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
