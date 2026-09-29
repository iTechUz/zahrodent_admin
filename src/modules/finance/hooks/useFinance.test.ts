import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useFinance } from './useFinance';
import { useStore } from '@/store/useStore';
import { mockPayments } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sum = (f: (p: (typeof mockPayments)[number]) => boolean) =>
  mockPayments.filter(f).reduce((s, p) => s + p.amount, 0);

describe('useFinance', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('computes revenue, debt, this-month and unpaid count from mock data', () => {
    const { result } = renderHook(() => useFinance());
    expect(result.current.totalRevenue).toBe(sum((p) => p.status === 'paid'));
    expect(result.current.totalRevenue).toBe(900000);
    expect(result.current.totalDebt).toBe(sum((p) => p.status !== 'paid'));
    expect(result.current.totalDebt).toBe(1850000);
    expect(result.current.thisMonth).toBe(sum((p) => p.status === 'paid' && p.date >= '2024-03-01'));
    expect(result.current.unpaidCount).toBe(4);
  });

  it('partial payments count fully as debt', () => {
    useStore.setState({ payments: [{ ...mockPayments[0], status: 'partial', amount: 100 }] });
    const { result } = renderHook(() => useFinance());
    expect(result.current.totalDebt).toBe(100);
    expect(result.current.totalRevenue).toBe(0);
  });

  it('empty payments give zeros', () => {
    useStore.setState({ payments: [] });
    const { result } = renderHook(() => useFinance());
    expect([result.current.totalRevenue, result.current.totalDebt, result.current.thisMonth, result.current.unpaidCount])
      .toEqual([0, 0, 0, 0]);
  });

  it('totals recompute after a store change', () => {
    const { result } = renderHook(() => useFinance());
    act(() => useStore.getState().updatePayment('pay3', { status: 'paid' }));
    expect(result.current.totalRevenue).toBe(1400000);
    expect(result.current.unpaidCount).toBe(3);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useFinance());
    act(() => result.current.setFilterStatus('unpaid'));
    expect(result.current.payments.map((p) => p.id)).toEqual(['pay3', 'pay6']);
  });

  it('searches patient name and description', () => {
    const { result } = renderHook(() => useFinance());
    act(() => result.current.setSearch('implant'));
    expect(result.current.payments.map((p) => p.id)).toEqual(['pay7']);
    act(() => result.current.setSearch('karimova'));
    expect(result.current.payments.map((p) => p.id)).toEqual(['pay1']);
  });

  it('creates a payment with generated id/date', () => {
    const { result } = renderHook(() => useFinance());
    act(() => result.current.openCreate());
    act(() =>
      result.current.handleSave({ patientId: 'p2', amount: 5000, method: 'cash', status: 'paid', description: 'abc' }),
    );
    const created = useStore.getState().payments.at(-1)!;
    expect(created).toMatchObject({ patientId: 'p2', amount: 5000, status: 'paid' });
    expect(created.id).toMatch(/^pay\d+$/);
    expect(created.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toast.success).toHaveBeenCalledWith("To'lov qayd etildi");
    expect(result.current.modalOpen).toBe(false);
  });

  it('updates the edited payment and keeps its date', () => {
    const { result } = renderHook(() => useFinance());
    act(() => result.current.openEdit(mockPayments[2]));
    act(() => result.current.handleSave({ ...result.current.editing!, status: 'paid' } as never));
    const p = useStore.getState().payments.find((x) => x.id === 'pay3')!;
    expect(p.status).toBe('paid');
    expect(p.date).toBe(mockPayments[2].date);
    expect(toast.success).toHaveBeenCalledWith("To'lov yangilandi");
  });

  it('deletes the payment by deleteId', () => {
    const { result } = renderHook(() => useFinance());
    act(() => result.current.handleDelete());
    expect(toast.success).not.toHaveBeenCalled();
    act(() => result.current.setDeleteId('pay1'));
    act(() => result.current.handleDelete());
    expect(useStore.getState().payments.some((p) => p.id === 'pay1')).toBe(false);
    expect(result.current.deleteId).toBeNull();
  });
});
