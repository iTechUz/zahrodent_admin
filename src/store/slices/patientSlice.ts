import { StateCreator } from 'zustand';
import { Patient } from '@/shared/types';
import { mockPatients } from '@/mock/data';

export interface PatientSlice {
  patients: Patient[];
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
}

export const createPatientSlice: StateCreator<PatientSlice> = (set) => ({
  patients: mockPatients,
  addPatient: (p) => set((s) => ({ patients: [...s.patients, p] })),
  updatePatient: (id, data) => set((s) => ({ patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
  deletePatient: (id) => set((s) => ({ patients: s.patients.filter((p) => p.id !== id) })),
});
