import { BookingSchema, BookingFormValues } from "@/shared/lib/validation";
import { Booking } from '@/shared/types';

export const BookingService = {
  initialState: (): BookingFormValues => ({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    source: 'walk-in',
    status: 'pending',
    notes: '',
  }),

  mapToForm: (b: Booking): BookingFormValues => ({
    patientId: b.patientId,
    doctorId: b.doctorId,
    date: b.date,
    time: b.time,
    source: b.source,
    status: b.status,
    notes: b.notes || '',
  }),

  validate: (form: BookingFormValues) => {
    const result = BookingSchema.safeParse(form);
    if (!result.success) return result.error.errors[0].message;
    return null;
  }
};
