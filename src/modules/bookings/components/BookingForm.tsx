import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BOOKING_SOURCES, BOOKING_SOURCE_LABELS } from '@/shared/constants';
import { Booking, Patient, Doctor, BookingSource } from '@/shared/types';
import { StatusBadge, SourceBadge } from '@/shared/components/StatusBadge';
import { BookingSchema } from '@/shared/lib/validation';
import * as z from 'zod';

type BookingFormValues = z.infer<typeof BookingSchema>;

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Booking | null;
  patients: Patient[];
  doctors: Doctor[];
  onSave: (data: BookingFormValues) => void;
}

export const BookingForm = ({ 
  open, 
  onOpenChange, 
  editing, 
  patients, 
  doctors, 
  onSave 
}: BookingFormProps) => {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
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
        date: '',
        time: '',
        source: 'walk-in',
        status: 'pending',
        notes: '',
      });
    }
  }, [editing, form, open]);

  const handleSubmit = (values: BookingFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                  <FormLabel>Bemor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bemorni tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shifokor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Shifokorni tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Sana</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Vaqt</FormLabel>
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

  const patient = patients.find((p) => p.id === booking.patientId);
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
            <span className="font-medium">{patient?.firstName} {patient?.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shifokor</span>
            <span className="font-medium">{doctor?.name}</span>
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
