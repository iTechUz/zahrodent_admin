import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { CancelReasonDialog } from './BookingStatusDialogs';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { PatientSelect } from '@/shared/components/PatientSelect';
import { QuickPatientCreate } from './QuickPatientCreate';
import { bookingsApi, patientsApi } from '@/lib/api/endpoints';
import { PhoneLink } from '@/shared/components/PhoneLink';
import { queryKeys } from '@/lib/api/query-keys';
import { useCan } from '@/shared/hooks/usePermissions';
import { busySlots, conflictingSlot } from '../services/booking.service';
import { doctorDayInfo, isInBreak } from '@/shared/lib/doctor-schedule';
import { formatDate } from '@/shared/lib/formatters';
import { resolvePatientRef } from '@/shared/lib/patient-ref';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  BOOKING_SOURCES,
  BOOKING_SOURCE_LABELS,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
} from '@/shared/constants';
import { Booking, BookingStatusLogEntry, Doctor, Patient, BookingSource, BookingStatus } from '@/shared/types';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { BookingSchema } from '@/shared/lib/validation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Service } from '@/shared/types';
import * as z from 'zod';
import { clinicToday } from '@/shared/lib/date-utils';

type BookingFormValues = z.infer<typeof BookingSchema>;

export const PAST_BOOKING_DATE_ERROR = "O'tgan sanaga qabul yozib bo'lmaydi";

/** New bookings can't be in the past (backend 400); editing an existing past booking is allowed. */
export function pastBookingDateError(date: string, isEdit: boolean, today: string = clinicToday()): string | null {
  return !isEdit && !!date && date < today ? PAST_BOOKING_DATE_ERROR : null;
}

/** Cancelling an existing booking through the edit form must collect a reason first (backend requires statusReason). */
export function needsCancelReason(editing: Pick<Booking, 'status'> | null, nextStatus: BookingStatus): boolean {
  return !!editing && editing.status !== 'cancelled' && nextStatus === 'cancelled';
}

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Booking | null;
  doctors: Doctor[];
  services: Service[];
  /** preselects the patient of a new booking (e.g. "Yangi qabul" on the patient profile) */
  initialPatientId?: string;
  onSave: (data: BookingFormValues, statusReason?: string) => void;
  isPending?: boolean;
}

export const BookingForm = ({ 
  open, 
  onOpenChange, 
  editing, 
  doctors, 
  services,
  initialPatientId,
  onSave,
  isPending = false,
}: BookingFormProps) => {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      serviceId: '',
      date: '',
      time: '',
      source: 'walk-in',
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        patientId: editing.patientId,
        doctorId: editing.doctorId,
        serviceId: editing.serviceId || '',
        date: editing.date,
        time: editing.time,
        source: editing.source,
        status: editing.status,
        notes: editing.notes || '',
      });
    } else {
      form.reset({
        patientId: initialPatientId ?? '',
        doctorId: '',
        serviceId: '',
        date: '',
        time: '',
        source: 'walk-in',
        status: 'pending',
        notes: '',
      });
    }
  }, [editing, form, open, initialPatientId]);

  const today = clinicToday();
  // cancelling via the edit form needs a reason (backend: statusReason required) → ask before saving
  const [pendingCancel, setPendingCancel] = useState<BookingFormValues | null>(null);
  useEffect(() => {
    if (!open) setPendingCancel(null);
  }, [open]);

  const can = useCan();
  const canQuickCreate = !editing && can('patients.create');
  const [quickOpen, setQuickOpen] = useState(false);
  /** patient created through "Yangi bemor" — shown as selected without another request */
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  useEffect(() => {
    if (!open) setQuickOpen(false);
  }, [open]);

  const watchedDoctorId = form.watch('doctorId');
  const watchedDate = form.watch('date');
  const watchedTime = form.watch('time');
  const selectedDoctor = doctors.find((d) => d.id === watchedDoctorId);
  const dayInfo = doctorDayInfo(selectedDoctor, watchedDate);

  // that doctor's bookings on the chosen day → busy time ranges (hint only; the backend still validates)
  const dayParams = { doctorId: watchedDoctorId, startDate: watchedDate, endDate: watchedDate, limit: 100 };
  const { data: dayBookings } = useQuery({
    queryKey: queryKeys.bookingsList(dayParams),
    queryFn: () => bookingsApi.list(dayParams),
    enabled: open && !!watchedDoctorId && !!watchedDate,
    meta: { silentError: true },
  });
  const slots = useMemo(
    () => busySlots(dayBookings?.data ?? [], services, editing?.id),
    [dayBookings, services, editing?.id],
  );
  const conflict = conflictingSlot(watchedTime, slots);
  const inBreak = dayInfo?.kind === 'working' && isInBreak(watchedTime, dayInfo.breakStart, dayInfo.breakEnd);

  const handleSubmit = (values: BookingFormValues) => {
    // backend rejects new bookings in the past (400) — catch it before the request
    const dateError = pastBookingDateError(values.date, !!editing, today);
    if (dateError) {
      form.setError('date', { message: dateError });
      return;
    }
    if (needsCancelReason(editing, values.status)) {
      setPendingCancel(values);
      return;
    }
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Qabulni tahrirlash" : "Yangi qabul yaratish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bemor <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <PatientSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      selected={
                        editing?.patient
                          ? { id: editing.patientId, ...editing.patient }
                          : createdPatient?.id === field.value
                            ? createdPatient
                            : null
                      }
                    />
                  </FormControl>
                  {canQuickCreate && !quickOpen && (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={() => setQuickOpen(true)}>
                      <UserPlus className="w-3.5 h-3.5" /> Yangi bemor
                    </Button>
                  )}
                  {quickOpen && (
                    <QuickPatientCreate
                      onCancel={() => setQuickOpen(false)}
                      onCreated={(p) => {
                        setCreatedPatient(p);
                        field.onChange(p.id);
                        setQuickOpen(false);
                      }}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shifokor <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={doctors.map(d => ({ value: d.id, label: `${d.firstName} ${d.lastName} (${d.specialty})` }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Shifokorni tanlang"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xizmat (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={services.map(s => ({ value: s.id, label: `${s.name} (${s.price} so'm)` }))}
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      placeholder="Xizmatni tanlang"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sana <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" min={editing ? undefined : today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vaqt <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedDoctorId && watchedDate && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1" data-testid="doctor-hint">
                {dayInfo?.kind === 'day-off' && (
                  <p className="text-destructive">Shifokorning dam olish kuni ({formatDate(watchedDate)})</p>
                )}
                {dayInfo?.kind === 'not-working' && (
                  <p className="text-destructive">Shifokor bu hafta kunida ishlamaydi</p>
                )}
                {dayInfo?.kind === 'working' && (
                  <p className="text-muted-foreground">
                    Ish vaqti: {dayInfo.startTime}–{dayInfo.endTime}
                    {dayInfo.breakStart && dayInfo.breakEnd ? ` • Tanaffus: ${dayInfo.breakStart}–${dayInfo.breakEnd}` : ''}
                  </p>
                )}
                {inBreak && <p className="text-warning">Tanlangan vaqt shifokor tanaffusiga to'g'ri keladi</p>}
                <p className="text-muted-foreground">
                  {slots.length === 0
                    ? 'Shu kunga band vaqtlar yo\'q'
                    : `Band vaqtlar: ${slots.map((s) => (s.end ? `${s.start}–${s.end}` : s.start)).join(', ')}`}
                </p>
                {conflict && (
                  <p className="text-warning">
                    Bu vaqtda shifokor band{conflict.patientName ? ` (${conflict.patientName})` : ''}
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manba</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOKING_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s as BookingSource]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holat</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOKING_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {BOOKING_STATUS_LABELS[s as BookingStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Izoh</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Qabul bo‘yicha izoh..." rows={3} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {editing ? "Yangilash" : "Yaratish"}
            </Button>
          </form>
        </Form>
      </DialogContent>
      <CancelReasonDialog
        open={!!pendingCancel}
        onOpenChange={(o) => !o && setPendingCancel(null)}
        onConfirm={(reason) => {
          if (pendingCancel) onSave(pendingCancel, reason);
          setPendingCancel(null);
        }}
      />
    </Dialog>
  );
};

interface BookingDetailsProps {
  booking: Booking | null;
  onClose: () => void;
  doctors: Doctor[];
  /** shown when given (the caller decides by permission) */
  onEdit?: (booking: Booking) => void;
}

/** Reason of the latest cancellation, from the status log (the booking row itself does not carry it). */
export function latestCancelReason(
  log: Pick<BookingStatusLogEntry, 'toStatus' | 'reason' | 'createdAt'>[] | undefined,
): string | null {
  const cancels = (log ?? []).filter((e) => e.toStatus === 'cancelled' && e.reason);
  if (cancels.length === 0) return null;
  return [...cancels].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[cancels.length - 1].reason;
}

export const BookingDetails = ({ booking, onClose, doctors, onEdit }: BookingDetailsProps) => {
  const { data: statusLog } = useQuery({
    queryKey: queryKeys.bookingStatusLog(booking?.id ?? ''),
    queryFn: () => bookingsApi.statusLog(booking!.id),
    enabled: !!booking && booking.status === 'cancelled',
    meta: { silentError: true },
  });

  // the booking row only embeds the patient's name → fetch the card for the phone number
  const { data: patientCard } = useQuery({
    queryKey: queryKeys.patient(booking?.patientId ?? ''),
    queryFn: () => patientsApi.get(booking!.patientId),
    enabled: !!booking?.patientId,
    meta: { silentError: true },
  });

  if (!booking) return null;

  const patient = resolvePatientRef(booking);
  const doctor = doctors.find((d) => d.id === booking.doctorId);
  const cancelReason = booking.status === 'cancelled' ? latestCancelReason(statusLog) : null;

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qabul tafsilotlari</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bemor</span>
            {booking.patientId ? (
              <Link to={`/patients/${booking.patientId}`} className="font-medium text-primary hover:underline" onClick={onClose}>
                <PatientNameLabel patient={patient} />
              </Link>
            ) : (
              <PatientNameLabel className="font-medium" patient={patient} />
            )}
          </div>
          {patientCard?.phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefon</span>
              <PhoneLink phone={patientCard.phone} />
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shifokor</span>
            <span className="font-medium">{doctor ? `${doctor.firstName} ${doctor.lastName}` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sana</span>
            <span>{formatDate(booking.date)} — {booking.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Manba</span>
            <SourceBadge source={booking.source} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Holat</span>
            <StatusBadge status={booking.status} />
          </div>
          {cancelReason && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Bekor qilish sababi</span>
              <span className="text-right">{cancelReason}</span>
            </div>
          )}
          {booking.notes && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Izoh</span>
              <span className="text-right whitespace-pre-wrap">{booking.notes}</span>
            </div>
          )}
        </div>
        {onEdit && (
          <Button variant="outline" className="w-full" onClick={() => { onClose(); onEdit(booking); }}>
            Tahrirlash
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
