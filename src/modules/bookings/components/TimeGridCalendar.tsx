import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can } from '@/shared/config/roles';
import { addDaysToDate, clinicToday } from '@/shared/lib/date-utils';
import { patientRefLabel, resolvePatientRef } from '@/shared/lib/patient-ref';
import { formatDate } from '@/shared/lib/formatters';
import { DOCTOR_WEEKDAY_LABELS } from '@/shared/lib/doctor-schedule';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Booking, Doctor } from '@/shared/types';
import type { BookingPrefill } from './BookingForm';
import {
  bookingsInSlot,
  clinicTimeNow,
  doctorWorksAt,
  isSlotPast,
  occupiesSlot,
  slotTimes,
  weekDays,
} from '../lib/calendar-grid';

export type TimeGridMode = 'day' | 'week';

interface TimeGridCalendarProps {
  mode: TimeGridMode;
  /** a free, bookable slot was clicked: date / time (and doctor when the column is one doctor) */
  onSlotClick: (prefill: BookingPrefill) => void;
  onBookingClick: (booking: Booking) => void;
}

const chipClass = (status: Booking['status']) =>
  cn(
    'block w-full truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight',
    status === 'confirmed' && 'bg-primary/15 text-primary',
    status === 'pending' && 'bg-warning/15 text-warning',
    status === 'completed' && 'bg-success/15 text-success',
    status === 'cancelled' && 'bg-destructive/15 text-destructive opacity-60 line-through',
    status === 'arrived' && 'bg-info/15 text-info',
    status === 'no-show' && 'bg-muted text-muted-foreground opacity-60 line-through',
  );

interface Column {
  key: string;
  date: string;
  doctor?: Doctor;
  title: string;
  subtitle: string;
}

/** Day / week time grid: bookings by time (and by doctor in the day view); a free slot opens the create form prefilled. */
export function TimeGridCalendar({ mode, onSlotClick, onBookingClick }: TimeGridCalendarProps) {
  const authed = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.currentUser);
  const canCreate = can(user?.role, 'bookings.create');
  const isDoctorRole = user?.role === 'doctor';

  const today = clinicToday();
  const [date, setDate] = useState(today);
  const [doctorFilter, setDoctorFilter] = useState('all');

  const days = useMemo(() => (mode === 'week' ? weekDays(date) : [date]), [mode, date]);
  const range = useMemo(() => ({ startDate: days[0], endDate: days[days.length - 1] }), [days]);

  const { data: bookingsRes } = useQuery({
    queryKey: queryKeys.bookingsLookup(range),
    queryFn: () => fetchAllPages(bookingsApi.list, range),
    enabled: authed,
  });
  const bookings = useMemo(() => bookingsRes?.data ?? [], [bookingsRes]);

  const { data: doctorsRes } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed,
  });
  const doctors = useMemo(() => doctorsRes?.data ?? [], [doctorsRes]);

  const { data: patientsRes } = useQuery({
    queryKey: queryKeys.patientsLookup(),
    queryFn: () => fetchAllPages(patientsApi.list),
    enabled: authed,
  });
  const patients = patientsRes?.data ?? [];

  // a doctor sees only their own column; others pick one doctor or see everybody
  const effectiveDoctorId = isDoctorRole ? user?.doctorId : doctorFilter === 'all' ? undefined : doctorFilter;
  const selectedDoctor = doctors.find((d) => d.id === effectiveDoctorId);

  const columns: Column[] = useMemo(() => {
    if (mode === 'week') {
      return days.map((d, i) => ({
        key: d,
        date: d,
        doctor: selectedDoctor,
        title: DOCTOR_WEEKDAY_LABELS[i],
        subtitle: d.slice(8) + '.' + d.slice(5, 7),
      }));
    }
    const list = effectiveDoctorId ? doctors.filter((d) => d.id === effectiveDoctorId) : doctors;
    return list.map((d) => ({
      key: d.id,
      date,
      doctor: d,
      title: `${d.firstName} ${d.lastName}`,
      subtitle: d.specialty,
    }));
  }, [mode, days, date, doctors, effectiveDoctorId, selectedDoctor]);

  const slots = useMemo(() => slotTimes(), []);
  const nowTime = clinicTimeNow();
  const step = mode === 'week' ? 7 : 1;

  const title =
    mode === 'week' ? `${formatDate(days[0])} — ${formatDate(days[6])}` : `${formatDate(date)}, ${DOCTOR_WEEKDAY_LABELS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" tooltip={mode === 'week' ? 'Oldingi hafta' : 'Oldingi kun'} className="h-8 w-8" onClick={() => setDate(addDaysToDate(date, -step))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[170px] text-center text-sm font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" tooltip={mode === 'week' ? 'Keyingi hafta' : 'Keyingi kun'} className="h-8 w-8" onClick={() => setDate(addDaysToDate(date, step))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {!isDoctorRole && (
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="h-8 w-[180px] text-xs" aria-label="Shifokor">
                <SelectValue placeholder="Shifokor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha shifokorlar</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setDate(today)}>
            Bugun
          </Button>
        </div>
      </div>

      {canCreate && (
        <p className="border-b border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
          Bo'sh vaqtga bosing — qabul yaratish oynasi sana va vaqt bilan ochiladi.
        </p>
      )}

      {columns.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Shifokorlar topilmadi</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <div
            className="grid min-w-[640px]"
            style={{ gridTemplateColumns: `56px repeat(${columns.length}, minmax(110px, 1fr))` }}
            data-testid="time-grid"
          >
            <div className="sticky top-0 z-10 border-b border-border bg-card" />
            {columns.map((c) => (
              <div
                key={c.key}
                className={cn(
                  'sticky top-0 z-10 border-b border-l border-border bg-card px-2 py-2 text-center',
                  mode === 'week' && c.date === today && 'bg-accent/30',
                )}
              >
                <p className="truncate text-xs font-semibold">{c.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{c.subtitle}</p>
              </div>
            ))}

            {slots.map((slot) => (
              <SlotRow
                key={slot}
                slot={slot}
                columns={columns}
                bookings={bookings}
                patients={patients}
                doctors={doctors}
                effectiveDoctorId={effectiveDoctorId}
                showDoctor={mode === 'week' && !effectiveDoctorId}
                today={today}
                nowTime={nowTime}
                canCreate={canCreate}
                onSlotClick={onSlotClick}
                onBookingClick={onBookingClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SlotRowProps {
  slot: string;
  columns: Column[];
  bookings: Booking[];
  patients: { id: string; firstName: string; lastName: string }[];
  doctors: Doctor[];
  effectiveDoctorId?: string;
  showDoctor: boolean;
  today: string;
  nowTime: string;
  canCreate: boolean;
  onSlotClick: (prefill: BookingPrefill) => void;
  onBookingClick: (booking: Booking) => void;
}

function SlotRow({ slot, columns, bookings, patients, doctors, effectiveDoctorId, showDoctor, today, nowTime, canCreate, onSlotClick, onBookingClick }: SlotRowProps) {
  const onTheHour = slot.endsWith(':00');
  return (
    <>
      <div className={cn('border-t border-border px-1 pt-0.5 text-right text-[10px] text-muted-foreground', !onTheHour && 'border-dashed')}>
        {slot}
      </div>
      {columns.map((c) => {
        const here = bookingsInSlot(bookings, c.date, slot, c.doctor?.id);
        const past = isSlotPast(c.date, slot, today, nowTime);
        const working = doctorWorksAt(c.doctor, c.date, slot);
        const busy = here.some(occupiesSlot);
        const free = canCreate && !past && working && !busy;
        return (
          <div
            key={c.key}
            role={free ? 'button' : undefined}
            tabIndex={free ? 0 : undefined}
            aria-label={free ? `Bo'sh vaqt ${c.date} ${slot}` : undefined}
            data-free={free ? 'true' : undefined}
            onClick={free ? () => onSlotClick({ date: c.date, time: slot, doctorId: c.doctor?.id ?? effectiveDoctorId }) : undefined}
            onKeyDown={
              free
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSlotClick({ date: c.date, time: slot, doctorId: c.doctor?.id ?? effectiveDoctorId });
                    }
                  }
                : undefined
            }
            className={cn(
              'group relative min-h-[34px] space-y-0.5 border-l border-t border-border p-0.5',
              (!working || past) && 'bg-muted/40',
              free && 'cursor-pointer hover:bg-primary/5 focus-visible:bg-primary/10 focus-visible:outline-none',
            )}
          >
            {here.map((b) => {
              const doctor = doctors.find((d) => d.id === b.doctorId);
              return (
                <button
                  key={b.id}
                  type="button"
                  title={`${b.time} · ${patientRefLabel(resolvePatientRef(b, patients))}${doctor ? ` · ${doctor.firstName} ${doctor.lastName}` : ''}`}
                  className={chipClass(b.status)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookingClick(b);
                  }}
                >
                  {b.time} {patientRefLabel(resolvePatientRef(b, patients), { short: true })}
                  {showDoctor && doctor ? ` · ${doctor.lastName}` : ''}
                </button>
              );
            })}
            {free && here.length === 0 && (
              <Plus className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-primary opacity-0 group-hover:opacity-60" />
            )}
          </div>
        );
      })}
    </>
  );
}
