import { describe, expect, it } from 'vitest';
import { BookingService } from './booking.service';
import { mockBookings } from '@/mock/data';

describe('BookingService', () => {
  it('initialState returns a fresh empty form each call', () => {
    const a = BookingService.initialState();
    expect(a).toEqual({ patientId: '', doctorId: '', date: '', time: '', source: 'walk-in', status: 'pending', notes: '' });
    expect(BookingService.initialState()).not.toBe(a);
  });

  it('mapToForm copies booking fields and drops id/createdAt/serviceId', () => {
    const b = { ...mockBookings[0], notes: 'n', serviceId: 's1' };
    expect(BookingService.mapToForm(b)).toEqual({
      patientId: b.patientId, doctorId: b.doctorId, date: b.date, time: b.time,
      source: b.source, status: b.status, notes: 'n',
    });
  });

  it('mapToForm defaults missing notes to empty string', () => {
    expect(BookingService.mapToForm({ ...mockBookings[0], notes: undefined }).notes).toBe('');
  });

  it('validate returns null for a valid form', () => {
    expect(BookingService.validate(BookingService.mapToForm(mockBookings[0]))).toBeNull();
  });

  it('validate returns the first error for the empty initial form', () => {
    expect(BookingService.validate(BookingService.initialState())).toBe('Bemor kiritilishi shart');
  });
});
