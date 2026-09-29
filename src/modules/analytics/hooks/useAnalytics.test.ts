import { renderHook, waitFor } from '@testing-library/react';
import { bookingsApi, doctorsApi, patientsApi, paymentsApi, servicesApi } from '@/lib/api/endpoints';
import { REPORT_CHART_COLORS } from '@/shared/lib/reporting';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { Booking, DoctorEfficiencyStats, Patient, Payment, Service } from '@/shared/types';
import { useAnalytics } from './useAnalytics';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const bookings = [
  { id: 'b1', date: '2026-06-01', status: 'completed', source: 'website' },
  { id: 'b2', date: '2026-06-02', status: 'pending', source: 'website' },
  { id: 'b3', date: '2026-05-02', status: 'completed', source: 'phone' },
] as Booking[];
const patients = [{ id: 'p1', createdAt: '2026-06-03' }, { id: 'p2', createdAt: '2026-04-03' }] as Patient[];
const payments = [
  { id: 'x1', date: '2026-06-03', amount: 2_340_000, status: 'paid' },
  { id: 'x2', date: '2026-06-04', amount: 9_000_000, status: 'unpaid' },
] as Payment[];
const services = [{ id: 's1', name: 'Plomba' }] as Service[];
const efficiency: DoctorEfficiencyStats[] = [
  {
    id: 'd1',
    firstName: 'Aziz',
    lastName: 'K',
    specialty: 'Terapevt',
    totalBookings: 10,
    totalVisits: 8,
    totalRevenue: 800,
    conversionRate: 80,
    avgCheck: 100,
  },
];

function setup() {
  const { wrapper } = createWrapper();
  return renderHook(() => useAnalytics(), { wrapper });
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 17, 12, 0));
  vi.mocked(bookingsApi.list).mockResolvedValue(paginated(bookings));
  vi.mocked(patientsApi.list).mockResolvedValue(paginated(patients));
  vi.mocked(paymentsApi.list).mockResolvedValue(paginated(payments));
  vi.mocked(servicesApi.list).mockResolvedValue(paginated(services));
  vi.mocked(servicesApi.stats).mockResolvedValue({
    totalCount: 1,
    categoriesCount: 1,
    avgPrice: 1,
    detailed: [
      { serviceId: 's1', revenue: 500, patients: 3 },
      { serviceId: 'gone', revenue: 100, patients: 1 },
    ],
  } as never);
  vi.mocked(doctorsApi.efficiency).mockResolvedValue(efficiency);
});

afterEach(() => vi.useRealTimers());

describe('useAnalytics (admin)', () => {
  beforeEach(() => loginAs('admin'));

  it('requests lists, service stats and doctor efficiency', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.doctorEfficiency).toHaveLength(1));
    expect(bookingsApi.list).toHaveBeenCalledWith();
    expect(patientsApi.list).toHaveBeenCalledWith();
    expect(paymentsApi.list).toHaveBeenCalledWith();
    expect(servicesApi.list).toHaveBeenCalledWith({ limit: 1000 });
    expect(servicesApi.stats).toHaveBeenCalled();
    expect(result.current.canViewPayments).toBe(true);
  });

  it('builds monthly series over the last 6 months', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.revenueGrowth.at(-1)?.revenue).toBe(2.3));
    expect(result.current.monthlyPatients.map((m) => m.count)).toEqual([0, 0, 0, 1, 0, 1]);
    expect(result.current.conversionData.slice(-2)).toEqual([
      { month: 'May', booked: 1, completed: 1 },
      { month: 'Iyn', booked: 2, completed: 1 },
    ]);
    expect(result.current.sourceData).toEqual([
      { name: 'Veb-sayt', value: 2 },
      { name: 'Telefon', value: 1 },
    ]);
  });

  it('joins service income with service names (unknown → "Noma\'lum")', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.serviceStats).toHaveLength(2));
    expect(result.current.serviceStats).toEqual([
      { name: 'Plomba', revenue: 500, patients: 3 },
      { name: "Noma'lum", revenue: 100, patients: 1 },
    ]);
  });

  it('maps doctor efficiency rows to chart rows', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.doctorEfficiency).toHaveLength(1));
    expect(result.current.doctorEfficiency[0]).toEqual({
      name: 'Aziz K',
      totalBookings: 10,
      totalVisits: 8,
      conversionRate: 80,
      avgCheck: 100,
      totalRevenue: 800,
    });
  });

  it('returns a copy of the chart palette', () => {
    const { result } = setup();
    expect(result.current.colors).toEqual([...REPORT_CHART_COLORS]);
    expect(result.current.colors).not.toBe(REPORT_CHART_COLORS);
  });

  it('empty stats → empty service income', async () => {
    vi.mocked(servicesApi.stats).mockResolvedValue({ totalCount: 0, categoriesCount: 0, avgPrice: 0 });
    const { result } = setup();
    await waitFor(() => expect(servicesApi.stats).toHaveBeenCalled());
    expect(result.current.serviceStats).toEqual([]);
  });

  it.todo(
    'BUG: src/modules/analytics/hooks/useAnalytics.ts:24,38,45 — bookings/patients/payments are listed without a limit, ' +
      'so the backend default (limit=10, PaginationQueryDto) applies and every analytics chart is built from the 10 newest rows',
  );
  it.todo(
    'BUG: src/lib/api/endpoints.ts:113 — servicesApi.stats() is typed without `detailed`, which the backend returns ' +
      '(services.service.ts:83-89); useAnalytics.ts:74 reads it through `any`',
  );
});

describe('useAnalytics (non-admin)', () => {
  it('does not request payments, service stats or efficiency', async () => {
    loginAs('receptionist');
    const { result } = setup();
    await waitFor(() => expect(bookingsApi.list).toHaveBeenCalled());
    expect(paymentsApi.list).not.toHaveBeenCalled();
    expect(servicesApi.stats).not.toHaveBeenCalled();
    expect(doctorsApi.efficiency).not.toHaveBeenCalled();
    expect(result.current.canViewPayments).toBe(false);
    expect(result.current.revenueGrowth.every((r) => r.revenue === 0)).toBe(true);
    expect(result.current.doctorEfficiency).toEqual([]);
  });
});
