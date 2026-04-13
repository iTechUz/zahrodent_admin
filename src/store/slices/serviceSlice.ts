import { StateCreator } from 'zustand';
import { Service, Notification } from '@/shared/types';
import { mockServices, mockNotifications } from '@/mock/data';

export interface ServiceSlice {
  services: Service[];
  notifications: Notification[];
  addService: (s: Service) => void;
  updateService: (id: string, s: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addNotification: (n: Notification) => void;
}

export const createServiceSlice: StateCreator<ServiceSlice> = (set) => ({
  services: mockServices,
  notifications: mockNotifications,
  addService: (s_) => set((s) => ({ services: [...s.services, s_] })),
  updateService: (id, data) => set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...data } : sv)) })),
  deleteService: (id) => set((s) => ({ services: s.services.filter((sv) => sv.id !== id) })),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
});
