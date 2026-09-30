import { useEffect } from 'react';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
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
import { Booking, Patient, Doctor, BookingSource, BookingStatus } from '@/shared/types';
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

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Booking | null;
  patients: Patient[];
  doctors: Doctor[];
  services: Service[];
  onSave: (data: BookingFormValues) => void;
}

export const BookingForm = ({ 
  open, 
  onOpenChange, 
  editing, 
  patients, 
  doctors, 
  services,
  onSave 
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
        patientId: '',
        doctorId: '',
        serviceId: '',
        date: '',
        time: '',
        source: 'walk-in',
        status: 'pending',
        notes: '',
      });
    }
  }, [editing, form, open]);

  const today = clinicToday();

  const handleSubmit = (values: BookingFormValues) => {
    // backend rejects new bookings in the past (400) — catch it before the request
    const dateError = pastBookingDateError(values.date, !!editing, today);
    if (dateError) {
      form.setError('date', { message: dateError });
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
                    <SearchableSelect
                      options={patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.phone})` }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Bemorni tanlang"
                    />
                  </FormControl>
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

            <Button type="submit" className="w-full">
              {editing ? "Yangilash" : "Yaratish"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

interface BookingDetailsProps {
  booking: Booking | null;
  onClose: () => void;
  patients: Patient[];
  doctors: Doctor[];
}

export const BookingDetails = ({ booking, onClose, patients, doctors }: BookingDetailsProps) => {
  if (!booking) return null;

  const patient = resolvePatientRef(booking, patients);
  const doctor = doctors.find((d) => d.id === booking.doctorId);

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qabul tafsilotlari</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bemor</span>
            <PatientNameLabel className="font-medium" patient={patient} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shifokor</span>
            <span className="font-medium">{doctor ? `${doctor.firstName} ${doctor.lastName}` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sana</span>
            <span>{booking.date} — {booking.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Manba</span>
            <SourceBadge source={booking.source} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Holat</span>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
