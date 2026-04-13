import { StateCreator } from 'zustand';
import { Doctor } from '@/shared/types';
import { mockDoctors } from '@/mock/data';

export interface DoctorSlice {
  doctors: Doctor[];
  addDoctor: (d: Doctor) => void;
  updateDoctor: (id: string, d: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
}

export const createDoctorSlice: StateCreator<DoctorSlice> = (set) => ({
  doctors: mockDoctors,
  addDoctor: (d) => set((s) => ({ doctors: [...s.doctors, d] })),
  updateDoctor: (id, data) => set((s) => ({ doctors: s.doctors.map((d) => (d.id === id ? { ...d, ...data } : d)) })),
  deleteDoctor: (id) => set((s) => ({ doctors: s.doctors.filter((d) => d.id !== id) })),
});
