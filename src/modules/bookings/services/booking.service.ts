import { BookingSchema, BookingFormValues } from "@/shared/lib/validation";
import { Booking } from '@/shared/types';

export const BookingService = {
  initialState: (): BookingFormValues => ({
    patientId: '',
    doctorId: '',
    serviceId: '',
    date: '',
    time: '',
    source: 'walk-in',
    status: 'pending',
    notes: '',
  }),

  mapToForm: (b: Booking): BookingFormValues => ({
    patientId: b.patientId,
    doctorId: b.doctorId,
    serviceId: b.serviceId || '',
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

export interface BusySlot {
  id: string;
  start: string; // HH:mm
  /** known only when the booked service has a duration */
  end?: string;
  patientName: string;
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMinutes = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * Time ranges a doctor is already booked for on one day (hint in the booking form).
 * Cancelled / no-show bookings free the slot; the booking being edited is ignored.
 */
export function busySlots(
  bookings: Pick<Booking, 'id' | 'time' | 'status' | 'serviceId' | 'patient'>[],
  services: { id: string; duration?: number }[] = [],
  excludeId?: string,
): BusySlot[] {
  return bookings
    .filter((b) => b.id !== excludeId && b.status !== 'cancelled' && b.status !== 'no-show' && /^\d{2}:\d{2}/.test(b.time))
    .map((b) => {
      const start = b.time.slice(0, 5);
      const duration = services.find((s) => s.id === b.serviceId)?.duration;
      return {
        id: b.id,
        start,
        ...(duration && duration > 0 ? { end: fromMinutes(toMinutes(start) + duration) } : {}),
        patientName: `${b.patient?.firstName ?? ''} ${b.patient?.lastName ?? ''}`.trim(),
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** The chosen time starts inside (or exactly at the start of) one of the busy slots. */
export function conflictingSlot(time: string, slots: BusySlot[]): BusySlot | undefined {
  if (!/^\d{2}:\d{2}/.test(time)) return undefined;
  const t = time.slice(0, 5);
  return slots.find((s) => (s.end ? t >= s.start && t < s.end : t === s.start));
}
