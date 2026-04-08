import { create } from 'zustand';
import { Patient, Doctor, Booking, Visit, Payment, Notification, Service } from '@/types';
import { MockUser } from '@/mock/users';
import { mockPatients, mockDoctors, mockBookings, mockVisits, mockPayments, mockNotifications, mockServices } from '@/mock/data';

interface AppState {
  currentUser: MockUser | null;
  isAuthenticated: boolean;
  login: (user: MockUser) => void;
  logout: () => void;

  patients: Patient[];
  doctors: Doctor[];
  bookings: Booking[];
  visits: Visit[];
  payments: Payment[];
  notifications: Notification[];
  services: Service[];
  darkMode: boolean;

  addPatient: (p: Patient) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  deletePatient: (id: string) => void;

  addDoctor: (d: Doctor) => void;
  updateDoctor: (id: string, d: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;

  addBooking: (b: Booking) => void;
  updateBooking: (id: string, b: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;

  addVisit: (v: Visit) => void;
  updateVisit: (id: string, v: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;

  addPayment: (p: Payment) => void;
  updatePayment: (id: string, p: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  addNotification: (n: Notification) => void;

  addService: (s: Service) => void;
  updateService: (id: string, s: Partial<Service>) => void;
  deleteService: (id: string) => void;

  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  login: (user) => set({ currentUser: user, isAuthenticated: true }),
  logout: () => set({ currentUser: null, isAuthenticated: false }),

  patients: mockPatients,
  doctors: mockDoctors,
  bookings: mockBookings,
  visits: mockVisits,
  payments: mockPayments,
  notifications: mockNotifications,
  services: mockServices,
  darkMode: false,

  addPatient: (p) => set((s) => ({ patients: [...s.patients, p] })),
  updatePatient: (id, data) => set((s) => ({ patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
  deletePatient: (id) => set((s) => ({ patients: s.patients.filter((p) => p.id !== id) })),

  addDoctor: (d) => set((s) => ({ doctors: [...s.doctors, d] })),
  updateDoctor: (id, data) => set((s) => ({ doctors: s.doctors.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
  deleteDoctor: (id) => set((s) => ({ doctors: s.doctors.filter((d) => d.id !== id) })),

  addBooking: (b) => set((s) => ({ bookings: [...s.bookings, b] })),
  updateBooking: (id, data) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
  deleteBooking: (id) => set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),

  addVisit: (v) => set((s) => ({ visits: [...s.visits, v] })),
  updateVisit: (id, data) => set((s) => ({ visits: s.visits.map((v) => (v.id === id ? { ...v, ...data } : v)) })),
  deleteVisit: (id) => set((s) => ({ visits: s.visits.filter((v) => v.id !== id) })),

  addPayment: (p) => set((s) => ({ payments: [...s.payments, p] })),
  updatePayment: (id, data) => set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
  deletePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),

  addService: (s_) => set((s) => ({ services: [...s.services, s_] })),
  updateService: (id, data) => set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...data } : sv)) })),
  deleteService: (id) => set((s) => ({ services: s.services.filter((sv) => sv.id !== id) })),

  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    document.documentElement.classList.toggle('dark', next);
    return { darkMode: next };
  }),
}));
