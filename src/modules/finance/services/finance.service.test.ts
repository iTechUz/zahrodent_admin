import type { Payment } from '@/shared/types';
import { FinanceService } from './finance.service';

const payment: Payment = {
  id: 'pay1',
  patientId: 'p1',
  amount: 150000,
  method: 'card',
  status: 'partial',
  type: 'INCOME',
  date: '2026-06-10',
  description: 'Plomba',
};

describe('FinanceService', () => {
  it('initialState', () => {
    expect(FinanceService.initialState()).toEqual({
      patientId: '',
      amount: 0,
      method: 'cash',
      status: 'unpaid',
      description: '',
    });
  });

  it('mapToForm', () => {
    expect(FinanceService.mapToForm(payment)).toEqual({
      patientId: 'p1',
      amount: 150000,
      method: 'card',
      status: 'partial',
      description: 'Plomba',
    });
    expect(FinanceService.mapToForm({ ...payment, description: undefined as unknown as string }).description).toBe('');
  });

  it('validate', () => {
    expect(FinanceService.validate(FinanceService.initialState())).toBe('Bemor kiritilishi shart');
    expect(FinanceService.validate({ ...FinanceService.mapToForm(payment), type: 'INCOME' })).toBeNull();
    expect(FinanceService.validate({ ...FinanceService.mapToForm(payment), type: 'INCOME', amount: 0 })).toBe(
      "Summa musbat son bo'lishi shart",
    );
  });
});
