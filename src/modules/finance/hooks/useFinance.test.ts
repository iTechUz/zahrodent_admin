import { act, renderHook, waitFor } from '@testing-library/react';
import { analyticsApi, doctorsApi, patientsApi, paymentsApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { PaymentFormValues } from '@/shared/lib/validation';
import type { Doctor, Payment } from '@/shared/types';
import { useFinance } from './useFinance';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const api = vi.mocked(paymentsApi);

const doctor = (id: string, firstName: string, specialty = 'Terapevt') =>
  ({ id, firstName, lastName: 'K', specialty, phone: '' }) as Doctor;

const payment: Payment = {
  id: 'pay1',
  patientId: 'p1',
  amount: 100000,
  method: 'cash',
  status: 'paid',
  type: 'INCOME',
  date: '2026-06-10',
  description: 'Plomba',
};

const form: PaymentFormValues = {
  patientId: 'p1',
  amount: 100000,
  method: 'cash',
  status: 'paid',
  type: 'INCOME',
  description: 'Plomba',
};

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => useFinance(), { wrapper }), invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T07:00:00Z')); // 12:00 in Tashkent
  loginAs('admin');
});

afterEach(() => vi.useRealTimers());

describe('useFinance', () => {
  it('lists payments with MTD range and all/all/all filters', async () => {
    api.list.mockResolvedValue(paginated([payment], 31));
    const { result } = setup();
    await waitFor(() => expect(result.current.payments).toEqual([payment]));
    expect(api.list).toHaveBeenCalledWith({
      page: 0,
      limit: 10,
      search: '',
      status: 'all',
      method: 'all',
      dateRange: 'month',
      type: 'all',
      startDate: '2026-06-01',
      endDate: '',
    });
    expect(result.current.totalCount).toBe(31);
    expect(result.current.totalPages).toBe(4);
  });

  it('type tab (INCOME/EXPENSE) is sent as a filter', async () => {
    const { result } = setup();
    act(() => result.current.setFilters('type', 'EXPENSE'));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'EXPENSE' })));
  });

  it('loads every page of patients and doctors for lookups, never more than 100 per request', async () => {
    vi.mocked(patientsApi.list).mockImplementation(async (p) => paginated([{ id: `p${p?.page}` }] as never, 250));
    const { result } = setup();
    await waitFor(() => expect(result.current.patients).toHaveLength(3));
    expect(vi.mocked(patientsApi.list).mock.calls.map(([p]) => p)).toEqual([
      { page: 0, limit: 100 },
      { page: 1, limit: 100 },
      { page: 2, limit: 100 },
    ]);
    expect(doctorsApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
  });

  describe('derived totals', () => {
    it('maps stats: totalRevenue, totalDebt = pendingAmount; defaults to 0 before load', async () => {
      let resolve!: (v: unknown) => void;
      api.stats.mockReturnValue(new Promise((r) => (resolve = r)) as never);
      const { result } = setup();
      expect(result.current.totalRevenue).toBe(0);
      expect(result.current.totalDebt).toBe(0);
      await act(async () => resolve({ totalRevenue: 5_000_000, pendingAmount: 750_000, todayRevenue: 120_000 }));
      await waitFor(() => expect(result.current.totalRevenue).toBe(5_000_000));
      expect(result.current.totalDebt).toBe(750_000);
    });

    it('doctorRevenue joins doctor names, computes rounded % of total revenue and sorts desc', async () => {
      api.stats.mockResolvedValue({ totalRevenue: 1_000_000, pendingAmount: 0, todayRevenue: 0 });
      api.doctorStats.mockResolvedValue([
        { doctorId: 'd1', total: 333_333 },
        { doctorId: 'd2', total: 600_000 },
        { doctorId: 'ghost', total: 66_667 },
      ]);
      vi.mocked(doctorsApi.list).mockResolvedValue(
        paginated([doctor('d1', 'Aziz'), doctor('d2', 'Bobur', 'Xirurg')]) as never,
      );
      const { result } = setup();
      await waitFor(() => expect(result.current.doctorRevenue[0]?.name).toBe('Bobur K'));
      expect(result.current.doctorRevenue).toEqual([
        { doctorId: 'd2', total: 600_000, name: 'Bobur K', specialty: 'Xirurg', percent: 60 },
        { doctorId: 'd1', total: 333_333, name: 'Aziz K', specialty: 'Terapevt', percent: 33 },
        { doctorId: 'ghost', total: 66_667, name: "Noma'lum", specialty: '', percent: 7 },
      ]);
    });

    it('percent is 0 when total revenue is 0 (no division by zero)', async () => {
      api.stats.mockResolvedValue({ totalRevenue: 0, pendingAmount: 0, todayRevenue: 0 });
      api.doctorStats.mockResolvedValue([{ doctorId: 'd1', total: 0 }]);
      const { result } = setup();
      await waitFor(() => expect(result.current.doctorRevenue).toHaveLength(1));
      expect(result.current.doctorRevenue[0].percent).toBe(0);
    });

    it('thisMonth is the current month revenue (not today) and unpaidCount comes from the backend', async () => {
      api.stats.mockResolvedValue({ totalRevenue: 9_000_000, pendingAmount: 400_000, todayRevenue: 120_000 });
      vi.mocked(analyticsApi.dashboard).mockResolvedValue({
        monthRevenue: 3_500_000,
        todayRevenue: 120_000,
        unpaidCount: 4,
        unpaidTotal: 400_000,
      } as never);
      const { result } = setup();
      await waitFor(() => expect(result.current.thisMonth).toBe(3_500_000));
      expect(result.current.todayRevenue).toBe(120_000);
      expect(result.current.unpaidCount).toBe(4);
      expect(analyticsApi.dashboard).toHaveBeenCalledWith({ date: '2026-06-17' });
    });
  });

  describe('mutations invalidate list + stats + doctor-stats', () => {
    const expectInvalidated = (invalidate: ReturnType<typeof vi.spyOn>) => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payments'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payments', 'stats'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payments', 'doctor-stats'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['analytics'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients'] });
    };

    it('create', async () => {
      api.create.mockResolvedValue(payment);
      const { result, invalidate } = setup();
      act(() => result.current.openCreate());
      act(() => result.current.handleSave(form));
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("To'lov qayd etildi"));
      expect(api.create.mock.calls[0][0]).toEqual(form);
      expect(result.current.modalOpen).toBe(false);
      expectInvalidated(invalidate);
    });

    it('update', async () => {
      api.update.mockResolvedValue(payment);
      const { result, invalidate } = setup();
      act(() => result.current.openEdit(payment));
      expect(result.current.editing).toEqual(payment);
      act(() => result.current.handleSave({ ...form, status: 'partial' }));
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("To'lov yangilandi"));
      expect(api.update).toHaveBeenCalledWith('pay1', { ...form, status: 'partial' });
      expectInvalidated(invalidate);
    });

    it('delete', async () => {
      api.remove.mockResolvedValue({ id: 'pay1' });
      const { result, invalidate } = setup();
      act(() => result.current.handleDelete());
      expect(api.remove).not.toHaveBeenCalled();
      act(() => result.current.setDeleteId('pay1'));
      act(() => result.current.handleDelete());
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("To'lov o'chirildi"));
      expect(api.remove.mock.calls[0][0]).toBe('pay1');
      expect(result.current.deleteId).toBeNull();
      expectInvalidated(invalidate);
    });
  });
});
