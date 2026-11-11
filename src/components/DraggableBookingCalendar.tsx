import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { patientRefLabel, resolvePatientRef } from '@/shared/lib/patient-ref';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { bookingsApi, doctorsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can } from '@/shared/config/roles';
import { clinicToday } from '@/shared/lib/date-utils';
import { formatDate } from '@/shared/lib/formatters';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, GripVertical } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Booking } from '@/shared/types';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

function formatDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Bookings can't be moved into the past (backend 400) — checked before the request. */
export function isPastCalendarDate(date: string, today: string = clinicToday()): boolean {
  return date < today;
}

export const PAST_DROP_ERROR = "O'tgan sanaga qabulni ko'chirib bo'lmaydi";

/**
 * What a drop should do: nothing, show an error, or ask for confirmation (a move notifies the patient,
 * so it never persists straight away).
 */
export function planCalendarMove(
  booking: Pick<Booking, 'date' | 'status'> | undefined,
  newDate: string,
  { canReschedule, today }: { canReschedule: boolean; today: string },
): 'ignore' | 'past' | 'confirm' {
  if (!canReschedule || !booking || booking.date === newDate) return 'ignore';
  if (!isMovableBooking(booking.status)) return 'ignore';
  if (isPastCalendarDate(newDate, today)) return 'past';
  return 'confirm';
}

const isInactive = (status: Booking['status']) => status === 'cancelled' || status === 'no-show';

/** Cancelled and completed bookings are history — they cannot be rescheduled by dragging. */
export const isMovableBooking = (status: Booking['status']) => status !== 'cancelled' && status !== 'completed';

/** "YYYY-MM-DD" (clinic time zone) → local Date at midnight, for the month grid. */
function ymdToLocalDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Draggable booking chip ───────────────────────────────────────────────────
function DraggableBookingChip({
  booking,
  patientName,
  onClick,
  isOverlay = false,
  draggable = true,
}: {
  booking: Booking;
  patientName: string;
  onClick: () => void;
  isOverlay?: boolean;
  draggable?: boolean;
}) {
  const canDrag = draggable && isMovableBooking(booking.status);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    data: { booking },
    disabled: !canDrag,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-0.5 w-full text-left text-[10px] md:text-xs px-1 py-0.5 rounded truncate transition-all group/chip',
        booking.status === 'confirmed' && 'bg-primary/15 text-primary',
        booking.status === 'pending' && 'bg-warning/15 text-warning',
        booking.status === 'completed' && 'bg-success/15 text-success',
        booking.status === 'cancelled' && 'bg-destructive/15 text-destructive',
        booking.status === 'arrived' && 'bg-info/15 text-info',
        booking.status === 'no-show' && 'bg-muted text-muted-foreground',
        isInactive(booking.status) && !isOverlay && 'opacity-50 line-through',
        isDragging && !isOverlay && 'opacity-30',
        isOverlay && 'opacity-90 shadow-lg cursor-grabbing',
      )}
    >
      {/* drag handle — always visible on touch / small screens, on hover or keyboard focus elsewhere */}
      {canDrag && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Qabulni boshqa kunga ko'chirish"
          className="opacity-60 md:opacity-0 md:group-hover/chip:opacity-60 focus-visible:opacity-100 [@media(hover:none)]:opacity-60 cursor-grab touch-none shrink-0 p-0.5 -m-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 md:w-2.5 md:h-2.5" />
        </button>
      )}
      <button onClick={onClick} className="truncate flex-1 text-left">
        <span className="hidden md:inline">{booking.time} </span>
        {patientName}
      </button>
    </div>
  );
}

// ─── Droppable day cell ───────────────────────────────────────────────────────
function DroppableDayCell({
  dateStr,
  date,
  isCurrentMonth,
  isToday,
  dayBookings,
  onBookingClick,
  onShowAll,
  draggable,
}: {
  dateStr: string;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayBookings: Booking[];
  onBookingClick: (b: Booking) => void;
  onShowAll: (dateStr: string) => void;
  draggable: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr, disabled: !draggable });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] md:min-h-[100px] border-b border-r border-border p-1 transition-colors',
        !isCurrentMonth && 'bg-muted/30',
        isToday && 'bg-accent/20',
        isOver && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
      )}
    >
      <div
        className={cn(
          'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
          isToday && 'bg-primary text-primary-foreground',
          !isCurrentMonth && 'text-muted-foreground/50',
        )}
      >
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {dayBookings.slice(0, 3).map((b) => {
          const p = resolvePatientRef(b);
          return (
            <DraggableBookingChip
              key={b.id}
              booking={b}
              patientName={patientRefLabel(p, { short: true })}
              onClick={() => onBookingClick(b)}
              draggable={draggable}
            />
          );
        })}
        {dayBookings.length > 3 && (
          <button
            type="button"
            className="text-[10px] text-primary hover:underline px-1"
            onClick={() => onShowAll(dateStr)}
          >
            +{dayBookings.length - 3} ta
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DraggableBookingCalendar({ onEdit }: { /** opens the booking form (the form lives on the bookings page) */ onEdit?: (booking: Booking) => void } = {}) {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const canReschedule = can(role, 'bookings.update');
  const queryClient = useQueryClient();

  // the visible month follows the clinic's calendar (Asia/Tashkent), not the browser's
  const [currentDate, setCurrentDate] = useState(() => ymdToLocalDate(clinicToday()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [dayListDate, setDayListDate] = useState<string | null>(null);
  const [doctorFilter, setDoctorFilter] = useState('all');
  /** a drop waits here until the user confirms (the move notifies the patient) */
  const [pendingMove, setPendingMove] = useState<{ booking: Booking; date: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  // only the visible 6-week grid, every page (the backend caps limit at 100)
  const range = useMemo(
    () => ({
      startDate: formatDateStr(calendarDays[0].date),
      endDate: formatDateStr(calendarDays[calendarDays.length - 1].date),
    }),
    [calendarDays],
  );

  // the doctor filter is applied by the server (smaller response, correct "+N ta" counts)
  const query = useMemo(() => (doctorFilter !== 'all' ? { ...range, doctorId: doctorFilter } : range), [range, doctorFilter]);
  const { data: bookingsRes } = useQuery({
    queryKey: queryKeys.bookingsLookup(query),
    queryFn: () => fetchAllPages(bookingsApi.list, query),
    enabled: authed,
  });
  const bookings = useMemo(() => bookingsRes?.data ?? [], [bookingsRes]);

  const { data: doctorsRes } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed,
  });
  const doctors = doctorsRes?.data ?? [];

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const today = clinicToday();

  // DnD sensors: mouse (8px distance, avoids accidental drags), touch (press-and-hold so scrolling still works)
  // and keyboard (focus the handle, Space, arrows, Space)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // Optimistic update mutation
  const updateBookingMut = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string; previousDate?: string }) =>
      bookingsApi.update(id, { date }),
    onSuccess: (_, { id, previousDate }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookingsStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      if (previousDate) {
        // undo: moving back is one click away
        toast.success('Qabul sanasi yangilandi', {
          action: { label: 'Qaytarish', onClick: () => updateBookingMut.mutate({ id, date: previousDate }) },
        });
      } else {
        toast.success('Qabul sanasi qaytarildi');
      }
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
      // backend explains why (time conflict, doctor's day off, outside working hours, …)
      toast.error(
        err instanceof ApiError && err.message
          ? `Qabul sanasi o'zgartirilmadi: ${err.message}`
          : "Xatolik yuz berdi, qabul sanasi o'zgartirilmadi",
      );
    },
  });

  function handleDragStart(event: DragStartEvent) {
    const booking = event.active.data.current?.booking as Booking;
    setActiveBooking(booking ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBooking(null);
    const { active, over } = event;
    if (!over) return;

    const booking = active.data.current?.booking as Booking;
    const newDate = over.id as string;

    const plan = planCalendarMove(booking, newDate, { canReschedule, today });
    if (plan === 'past') toast.error(PAST_DROP_ERROR);
    // moving notifies the patient → confirm first
    if (plan === 'confirm') setPendingMove({ booking, date: newDate });
  }

  function confirmMove() {
    if (pendingMove && !updateBookingMut.isPending) {
      updateBookingMut.mutate({ id: pendingMove.booking.id, date: pendingMove.date, previousDate: pendingMove.booking.date });
    }
    setPendingMove(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" tooltip="Oldingi oy" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-sm font-semibold min-w-[140px] text-center">
              {MONTHS[month]} {year}
            </h3>
            <Button variant="ghost" size="icon" tooltip="Keyingi oy" className="h-8 w-8" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="Shifokor"><SelectValue placeholder="Shifokor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha shifokorlar</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canReschedule && (
              <p className="text-xs text-muted-foreground hidden sm:block">
                Qabullarni boshqa kunga surgab o'tkazing
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(ymdToLocalDate(clinicToday()))} className="text-xs">
              Bugun
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dateStr = formatDateStr(day.date);
            const dayBookings = bookingsByDate[dateStr] || [];
            return (
              <DroppableDayCell
                key={i}
                dateStr={dateStr}
                date={day.date}
                isCurrentMonth={day.isCurrentMonth}
                isToday={dateStr === today}
                dayBookings={dayBookings}
                onBookingClick={setSelectedBooking}
                onShowAll={setDayListDate}
                draggable={canReschedule}
              />
            );
          })}
        </div>
      </div>

      {/* Drag overlay (ghost that follows cursor) */}
      <DragOverlay dropAnimation={null}>
        {activeBooking && (() => {
          const p = resolvePatientRef(activeBooking);
          return (
            <DraggableBookingChip
              booking={activeBooking}
              patientName={patientRefLabel(p, { short: true })}
              onClick={() => {}}
              isOverlay
            />
          );
        })()}
      </DragOverlay>

      {/* Full list of one day (the cell only fits 3 chips) */}
      <Dialog open={!!dayListDate} onOpenChange={(o) => !o && setDayListDate(null)}>
        <DialogContent className="sm:max-w-[460px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dayListDate ? formatDate(dayListDate) : ''} — qabullar</DialogTitle></DialogHeader>
          <ul className="space-y-1">
            {(dayListDate ? bookingsByDate[dayListDate] ?? [] : []).map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-left"
                  onClick={() => {
                    setSelectedBooking(b);
                    setDayListDate(null);
                  }}
                >
                  <span className={cn('truncate', isInactive(b.status) && 'opacity-60 line-through')}>
                    {b.time} · {patientRefLabel(resolvePatientRef(b))}
                  </span>
                  <StatusBadge status={b.status} />
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Booking detail modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Qabul tafsilotlari</DialogTitle></DialogHeader>
          {selectedBooking && (() => {
            const patient = resolvePatientRef(selectedBooking);
            const doctor = doctors.find((d) => d.id === selectedBooking.doctorId);
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bemor</span>
                  <Link
                    to={`/patients/${selectedBooking.patientId}`}
                    className="font-medium text-primary hover:underline"
                    onClick={() => setSelectedBooking(null)}
                  >
                    <PatientNameLabel patient={patient} />
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shifokor</span>
                  <span className="font-medium">
                    {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vaqt</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(selectedBooking.date)} — {selectedBooking.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Manba</span>
                  <SourceBadge source={selectedBooking.source} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Holat</span>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                {selectedBooking.notes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Izoh</span>
                    <span className="text-right max-w-[200px]">{selectedBooking.notes}</span>
                  </div>
                )}
                {onEdit && canReschedule && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const b = selectedBooking;
                      setSelectedBooking(null);
                      onEdit(b);
                    }}
                  >
                    Tahrirlash
                  </Button>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!pendingMove}
        onOpenChange={(o) => !o && setPendingMove(null)}
        onConfirm={confirmMove}
        title="Qabulni boshqa kunga ko'chirasizmi?"
        description={
          pendingMove
            ? `${formatDate(pendingMove.booking.date)} → ${formatDate(pendingMove.date)}. Bemorga qabul sanasi o'zgargani haqida xabar yuborilishi mumkin.`
            : ''
        }
        confirmLabel="Ha, ko'chirish"
        destructive={false}
      />
    </DndContext>
  );
}
