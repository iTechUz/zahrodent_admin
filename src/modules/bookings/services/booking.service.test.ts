import type { Booking } from '@/shared/types';
import { BookingService } from './booking.service';

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
