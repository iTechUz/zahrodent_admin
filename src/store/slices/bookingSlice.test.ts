import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store/useStore';
import { mockBookings, mockVisits } from '@/mock/data';
import { Booking, Visit } from '@/shared/types';
import { describeCrudSlice } from '@/test/crudSliceCases';
import { resetStore } from '@/test/resetStore';

describeCrudSlice<Booking>({
  name: 'bookingSlice (bookings)',
  listKey: 'bookings',
  initial: mockBookings,
  add: (s, b) => s.addBooking(b),
  update: (s, id, b) => s.updateBooking(id, b),
  remove: (s, id) => s.deleteBooking(id),
  makeNew: () => ({
    id: 'b-new',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2024-04-05',
    time: '12:00',
    source: 'phone',
    status: 'pending',
    createdAt: '2024-04-01',
  }),
  patch: { status: 'cancelled', notes: 'Bekor' },
});

describeCrudSlice<Visit>({
  name: 'bookingSlice (visits)',
  listKey: 'visits',
  initial: mockVisits,
  add: (s, v) => s.addVisit(v),
  update: (s, id, v) => s.updateVisit(id, v),
  remove: (s, id) => s.deleteVisit(id),
  makeNew: () => ({
    id: 'v-new',
    patientId: 'p2',
    doctorId: 'd2',
    date: '2024-04-05',
    status: 'not-started',
    diagnosis: '',
    treatment: '',
    notes: '',
  }),
  patch: { status: 'completed', diagnosis: 'Kariyes' },
});

describe('bookingSlice specifics', () => {
  beforeEach(resetStore);

  it('booking and visit actions are independent', () => {
    useStore.getState().deleteBooking('b1');
    expect(useStore.getState().visits).toBe(mockVisits);
    useStore.getState().deleteVisit('v1');
    expect(useStore.getState().bookings.some((b) => b.id === 'b1')).toBe(false);
    expect(useStore.getState().visits.some((v) => v.id === 'v1')).toBe(false);
  });

  it('status-only update keeps every other booking field', () => {
    useStore.getState().updateBooking('b2', { status: 'arrived' });
    const b2 = useStore.getState().bookings.find((b) => b.id === 'b2');
    expect(b2).toEqual({ ...mockBookings[1], status: 'arrived' });
  });
});
