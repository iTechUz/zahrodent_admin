import { StateCreator } from 'zustand';
import { Payment } from '@/shared/types';
import { mockPayments } from '@/mock/data';

export interface FinanceSlice {
  payments: Payment[];
  addPayment: (p: Payment) => void;
  updatePayment: (id: string, p: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
}

export const createFinanceSlice: StateCreator<FinanceSlice> = (set) => ({
  payments: mockPayments,
  addPayment: (p) => set((s) => ({ payments: [...s.payments, p] })),
  updatePayment: (id, data) => set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
  deletePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
});
