import { renderHook, waitFor } from '@testing-library/react';
import { analyticsApi, bookingsApi, doctorsApi, patientsApi, paymentsApi, servicesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { REPORT_CHART_COLORS } from '@/shared/lib/reporting';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { DoctorEfficiencyStats, MonthlyAnalyticsRow, Service } from '@/shared/types';
import { useAnalytics } from './useAnalytics';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const monthly: MonthlyAnalyticsRow[] = [
  { month: '2026-01', newPatients: 0, bookings: 0, completedBookings: 0, revenue: 0, expenses: 0 },
  { month: '2026-02', newPatients: 0, bookings: 0, completedBookings: 0, revenue: 0, expenses: 0 },
  { month: '2026-03', newPatients: 0, bookings: 0, completedBookings: 0, revenue: 0, expenses: 0 },
  { month: '2026-04', newPatients: 1, bookings: 0, completedBookings: 0, revenue: 0, expenses: 0 },
  { month: '2026-05', newPatients: 0, bookings: 1, completedBookings: 1, revenue: 0, expenses: 0 },
  { month: '2026-06', newPatients: 1, bookings: 2, completedBookings: 1, revenue: 2_340_000, expenses: 0 },
];
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
  vi.mocked(analyticsApi.monthly).mockResolvedValue(monthly);
  vi.mocked(analyticsApi.sources).mockResolvedValue([
    { source: 'website', count: 2 },
    { source: 'phone', count: 1 },
  ]);
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

  it('uses the backend aggregates instead of listing (and truncating) raw rows', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.doctorEfficiency).toHaveLength(1));
    expect(analyticsApi.monthly).toHaveBeenCalledWith({ months: 6 });
    expect(analyticsApi.sources).toHaveBeenCalled();
    expect(bookingsApi.list).not.toHaveBeenCalled();
    expect(patientsApi.list).not.toHaveBeenCalled();
    expect(paymentsApi.list).not.toHaveBeenCalled();
    // service names: every page, max 100 per request
    expect(servicesApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
    expect(servicesApi.stats).toHaveBeenCalled();
    expect(result.current.canViewPayments).toBe(true);
  });

  it('exposes an error state when /analytics/monthly fails', async () => {
    vi.mocked(analyticsApi.monthly).mockRejectedValue(new ApiError(500, 'x'));
    const { result } = setup();
    await waitFor(() => expect(result.current.isError).toBe(true));
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

  it('servicesApi.stats() is typed with `detailed` (no `any` needed)', async () => {
    const stats = await servicesApi.stats();
    const detailed: { serviceId: string; revenue: number; patients: number }[] | undefined = stats.detailed;
    expect(detailed?.[0]).toEqual({ serviceId: 's1', revenue: 500, patients: 3 });
  });
});

describe('useAnalytics (non-admin)', () => {
  it('does not request payments, service stats or efficiency', async () => {
    loginAs('receptionist');
    vi.mocked(analyticsApi.monthly).mockResolvedValue(monthly.map((r) => ({ ...r, revenue: null, expenses: null })));
    const { result } = setup();
    await waitFor(() => expect(analyticsApi.monthly).toHaveBeenCalled());
    expect(paymentsApi.list).not.toHaveBeenCalled();
    expect(servicesApi.stats).not.toHaveBeenCalled();
    expect(doctorsApi.efficiency).not.toHaveBeenCalled();
    expect(result.current.canViewPayments).toBe(false);
    expect(result.current.revenueGrowth.every((r) => r.revenue === 0)).toBe(true);
    expect(result.current.doctorEfficiency).toEqual([]);
  });
});
