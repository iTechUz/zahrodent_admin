import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, List, CalendarDays } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BOOKING_STATUSES, BOOKING_SOURCES, BOOKING_STATUS_LABELS, BOOKING_SOURCE_LABELS } from '@/shared/constants';
import { useBookings } from '../hooks/useBookings';
import { BookingForm, BookingDetails } from '../components/BookingForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { Booking } from '@/shared/types';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/lib/formatters';

function BookingsPageContent() {
  const {
    bookings,
    totalBookings,
    patients,
    doctors,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
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
    handleSave,
    handleDelete,
    handleStatusChange,
  } = useBookings();

  const columns: Column<Booking>[] = [
    { 
      header: 'Bemor', 
      accessor: (b) => {
        const p = patients.find(patient => patient.id === b.patientId);
        return <span className="font-medium">{p?.firstName} {p?.lastName}</span>;
      }
    },
    { 
      header: 'Shifokor', 
      accessor: (b) => {
        const d = doctors.find(doctor => doctor.id === b.doctorId);
        return <span className="text-muted-foreground hidden sm:inline">{d?.name}</span>;
      },
      className: 'hidden sm:table-cell'
    },
    { 
      header: 'Sana/Vaqt', 
      accessor: (b) => <span className="text-muted-foreground">{formatDate(b.date)} {b.time}</span> 
    },
    { 
      header: 'Manba', 
      accessor: (b) => <SourceBadge source={b.source} />,
      className: 'hidden md:table-cell'
    },
    { 
      header: 'Holat', 
      accessor: (b) => (
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
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Yangi qabul
          </Button>
        } 
      />

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
                className="pl-9" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Manba" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha manbalar</SelectItem>
                {BOOKING_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable 
            data={bookings} 
            columns={columns} 
            onView={setViewBooking}
            onEdit={openEdit} 
            onDelete={setDeleteId} 
          />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl border-x">
              <p className="text-xs text-muted-foreground">Jami: {totalBookings} ta qabul</p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button 
                    key={i} 
                    variant={page === i ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-7 w-7 p-0" 
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <BookingCalendar />
        </TabsContent>
      </Tabs>

      <BookingForm 
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        patients={patients}
        doctors={doctors}
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
