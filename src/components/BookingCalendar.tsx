import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { StatusBadge, SourceBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Booking } from '@/types';

const WEEKDAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

export function BookingCalendar() {
  const { bookings, patients, doctors } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Next month fill
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today = formatDate(new Date());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-sm font-semibold min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
          Bugun
        </Button>
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
          const dateStr = formatDate(day.date);
          const dayBookings = bookingsByDate[dateStr] || [];
          const isToday = dateStr === today;

          return (
            <div
              key={i}
              className={cn(
                'min-h-[80px] md:min-h-[100px] border-b border-r border-border p-1 transition-colors',
                !day.isCurrentMonth && 'bg-muted/30',
                isToday && 'bg-accent/30',
              )}
            >
              <div className={cn(
                'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                isToday && 'bg-primary text-primary-foreground',
                !day.isCurrentMonth && 'text-muted-foreground/50',
              )}>
                {day.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => {
                  const patient = patients.find((p) => p.id === b.patientId);
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={cn(
                        'w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate transition-colors',
                        b.status === 'confirmed' && 'bg-primary/15 text-primary hover:bg-primary/25',
                        b.status === 'pending' && 'bg-warning/15 text-warning hover:bg-warning/25',
                        b.status === 'completed' && 'bg-success/15 text-success hover:bg-success/25',
                        b.status === 'cancelled' && 'bg-destructive/15 text-destructive hover:bg-destructive/25',
                        b.status === 'arrived' && 'bg-info/15 text-info hover:bg-info/25',
                        b.status === 'no-show' && 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      <span className="hidden md:inline">{b.time} </span>
                      {patient?.firstName}
                    </button>
                  );
                })}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{dayBookings.length - 3} ta</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking detail modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Qabul tafsilotlari</DialogTitle></DialogHeader>
          {selectedBooking && (() => {
            const patient = patients.find((p) => p.id === selectedBooking.patientId);
            const doctor = doctors.find((d) => d.id === selectedBooking.doctorId);
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Bemor</span><span className="font-medium">{patient?.firstName} {patient?.lastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shifokor</span><span className="font-medium">{doctor?.name}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Vaqt</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedBooking.date} — {selectedBooking.time}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Manba</span><SourceBadge source={selectedBooking.source} /></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Holat</span><StatusBadge status={selectedBooking.status} /></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
