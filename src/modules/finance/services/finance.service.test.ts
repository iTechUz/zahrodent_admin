import { describe, expect, it } from 'vitest';
import { FinanceService } from './finance.service';
import { mockPayments } from '@/mock/data';

describe('FinanceService', () => {
  it('initialState is an unpaid cash payment with zero amount', () => {
    expect(FinanceService.initialState()).toEqual({
      patientId: '', amount: 0, method: 'cash', status: 'unpaid', description: '',
    });
  });

  it('mapToForm copies payment fields', () => {
    const p = mockPayments[0];
    expect(FinanceService.mapToForm(p)).toEqual({
      patientId: p.patientId, amount: p.amount, method: p.method, status: p.status, description: p.description,
    });
  });

  it('mapToForm defaults an empty description', () => {
    expect(FinanceService.mapToForm({ ...mockPayments[0], description: undefined }).description).toBe('');
  });

  it('validate: all mock payments are valid', () => {
    mockPayments.forEach((p) => expect(FinanceService.validate(FinanceService.mapToForm(p))).toBeNull());
  });

  it('validate: initial form fails on patient first', () => {
    expect(FinanceService.validate(FinanceService.initialState())).toBe('Bemor kiritilishi shart');
  });

  it('validate: zero amount', () => {
    expect(FinanceService.validate({ ...FinanceService.mapToForm(mockPayments[0]), amount: 0 })).toBe(
      "Summa musbat son bo'lishi shart",
    );
  });
});
