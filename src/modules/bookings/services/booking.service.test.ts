import type { Booking } from '@/shared/types';
import { BookingService, busySlots, conflictingSlot } from './booking.service';

const booking: Booking = {
  id: 'b1',
  patientId: 'p1',
  doctorId: 'd1',
  date: '2026-06-10',
  time: '10:00',
  source: 'telegram',
  status: 'confirmed',
  createdAt: '2026-06-01',
};

describe('BookingService', () => {
  it('initialState is an empty walk-in/pending form', () => {
    expect(BookingService.initialState()).toEqual({
      patientId: '',
      doctorId: '',
      serviceId: '',
      date: '',
      time: '',
      source: 'walk-in',
      status: 'pending',
      notes: '',
    });
  });

  it('mapToForm copies fields and defaults optional ones to ""', () => {
    expect(BookingService.mapToForm(booking)).toEqual({
      patientId: 'p1',
      doctorId: 'd1',
      serviceId: '',
      date: '2026-06-10',
      time: '10:00',
      source: 'telegram',
      status: 'confirmed',
      notes: '',
    });
    expect(BookingService.mapToForm({ ...booking, serviceId: 's1', notes: 'n' })).toMatchObject({
      serviceId: 's1',
      notes: 'n',
    });
  });

  it('validate returns the first error message, or null', () => {
    expect(BookingService.validate(BookingService.initialState())).toBe('Bemor kiritilishi shart');
    expect(BookingService.validate(BookingService.mapToForm(booking))).toBeNull();
  });
});

describe('busySlots / conflictingSlot', () => {
  const rows = [
    { id: 'b2', time: '11:30', status: 'confirmed', serviceId: 's1', patient: { firstName: 'Vali', lastName: 'K' } },
    { id: 'b1', time: '10:00', status: 'pending', serviceId: undefined, patient: { firstName: 'Ali', lastName: 'V' } },
    { id: 'b3', time: '12:00', status: 'cancelled' },
    { id: 'b4', time: '13:00', status: 'no-show' },
    { id: 'b5', time: '15:00', status: 'pending' },
  ] as Parameters<typeof busySlots>[0];

  it('sorts by time, skips cancelled / no-show and the booking being edited, derives the end from the service duration', () => {
    const slots = busySlots(rows, [{ id: 's1', duration: 45 }], 'b5');
    expect(slots).toEqual([
      { id: 'b1', start: '10:00', patientName: 'Ali V' },
      { id: 'b2', start: '11:30', end: '12:15', patientName: 'Vali K' },
    ]);
  });

  it('conflict: exact start when the length is unknown, inside the range when it is known', () => {
    const slots = busySlots(rows, [{ id: 's1', duration: 45 }], 'b5');
    expect(conflictingSlot('10:00', slots)?.id).toBe('b1');
    expect(conflictingSlot('10:30', slots)).toBeUndefined();
    expect(conflictingSlot('12:00', slots)?.id).toBe('b2');
    expect(conflictingSlot('12:15', slots)).toBeUndefined();
    expect(conflictingSlot('', slots)).toBeUndefined();
  });
});
