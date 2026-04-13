import { StateCreator } from 'zustand';
import { Booking, Visit } from '@/shared/types';
import { mockBookings, mockVisits } from '@/mock/data';

export interface BookingSlice {
  bookings: Booking[];
  visits: Visit[];
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, b: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  addVisit: (v: Visit) => void;
  updateVisit: (id: string, v: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;
}

export const createBookingSlice: StateCreator<BookingSlice> = (set) => ({
  bookings: mockBookings,
  visits: mockVisits,
  addBooking: (b) => set((s) => ({ bookings: [...s.bookings, b] })),
  updateBooking: (id, data) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
  deleteBooking: (id) => set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
  addVisit: (v) => set((s) => ({ visits: [...s.visits, v] })),
  updateVisit: (id, data) => set((s) => ({ visits: s.visits.map((v) => (v.id === id ? { ...v, ...data } : v)) })),
  deleteVisit: (id) => set((s) => ({ visits: s.visits.filter((v) => v.id !== id) })),
});
