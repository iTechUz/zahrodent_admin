import { renderHook, waitFor } from '@testing-library/react';
import { analyticsApi, bookingsApi, doctorsApi, patientsApi, paymentsApi, visitsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { Booking, DashboardAnalytics, Doctor, MonthlyAnalyticsRow, Patient } from '@/shared/types';
import { useDashboard } from './useDashboard';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const dashboard: DashboardAnalytics = {
  totalPatients: 1234,
  newPatientsThisMonth: 42,
  todayBookings: 17,
  todayCompleted: 5,
  pendingBookings: 9,
  activeDoctors: 3,
  totalDoctors: 7,
  todayRevenue: 1_500_000,
  monthRevenue: 48_000_000,
  monthExpenses: 12_000_000,
  unpaidTotal: 3_200_000,
  unpaidCount: 11,
};

const monthly: MonthlyAnalyticsRow[] = [
  { month: '2026-01', newPatients: 10, bookings: 50, completedBookings: 40, revenue: 10_000_000, expenses: 1 },
  { month: '2026-02', newPatients: 0, bookings: 0, completedBookings: 0, revenue: 0, expenses: 0 },
  { month: '2026-03', newPatients: 5, bookings: 20, completedBookings: 10, revenue: 5_000_000, expenses: 0 },
  { month: '2026-04', newPatients: 7, bookings: 30, completedBookings: 20, revenue: 7_000_000, expenses: 0 },
  { month: '2026-05', newPatients: 20, bookings: 60, completedBookings: 50, revenue: 24_000_000, expenses: 0 },
  { month: '2026-06', newPatients: 40, bookings: 80, completedBookings: 70, revenue: 48_000_000, expenses: 0 },
];

const recent = [
  { id: 'b1', patientId: 'p1', doctorId: 'd1', date: '2026-06-17', time: '10:00', status: 'pending', source: 'telegram' },
  { id: 'b2', patientId: 'p2', doctorId: 'd2', date: '2026-06-17', time: '09:00', status: 'completed', source: 'phone' },
] as Booking[];

function setup() {
  const { wrapper, queryClient } = createWrapper(undefined, { router: true });
  return { ...renderHook(() => useDashboard(), { wrapper }), queryClient };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T12:00:00.000Z'));
  vi.mocked(analyticsApi.dashboard).mockResolvedValue(dashboard);
  vi.mocked(analyticsApi.monthly).mockResolvedValue(monthly);
  vi.mocked(analyticsApi.sources).mockResolvedValue([
    { source: 'telegram', count: 2 },
    { source: 'walk-in', count: 1 },
    { source: 'phone', count: 1 },
  ]);
  vi.mocked(bookingsApi.list).mockResolvedValue(paginated(recent, 120));
  vi.mocked(doctorsApi.list).mockResolvedValue(
    paginated([
      { id: 'd1', firstName: 'Aziz', lastName: 'Karimov' },
      { id: 'd2', firstName: 'Olim', lastName: 'Sobirov' },
    ] as Doctor[]),
  );
  vi.mocked(patientsApi.get).mockImplementation(
    async (id: string) => ({ id, firstName: `F-${id}`, lastName: `L-${id}` }) as Patient,
  );
});

afterEach(() => vi.useRealTimers());

describe('useDashboard (admin)', () => {
  beforeEach(() => loginAs('admin'));

  it('uses the backend aggregates — no client-side aggregation over truncated lists', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(analyticsApi.dashboard).toHaveBeenCalledWith({ date: '2026-06-17' });
    expect(analyticsApi.monthly).toHaveBeenCalledWith({ months: 6 });
    expect(analyticsApi.sources).toHaveBeenCalled();
    // no bulk list scans any more
    expect(paymentsApi.list).not.toHaveBeenCalled();
    expect(visitsApi.list).not.toHaveBeenCalled();
    expect(patientsApi.list).not.toHaveBeenCalled();
    expect(bookingsApi.list).toHaveBeenCalledWith({ limit: 5 });
  });

  it('exposes the headline figures from /analytics/dashboard', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.totalPatients).toBe(1234));
    expect(result.current).toMatchObject({
      totalPatients: 1234,
      newPatients: 42,
      todayBookings: 17,
      completedToday: 5,
      pendingBookings: 9,
      activeDoctors: 3,
      totalDoctors: 7,
      monthRevenue: 48_000_000,
      totalDebt: 3_200_000,
      unpaidCount: 11,
      canViewPayments: true,
      isError: false,
    });
  });

  it("asks for the Tashkent date, not UTC, right after local midnight", async () => {
    vi.setSystemTime(new Date('2026-06-16T19:30:00.000Z')); // 00:30 on 06-17 in Tashkent
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(analyticsApi.dashboard).toHaveBeenCalledWith({ date: '2026-06-17' });
  });

  it('builds the 6-month chart series from /analytics/monthly', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.patientGrowth).toHaveLength(6));
    expect(result.current.patientGrowth.map((p) => p.month)).toEqual(['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn']);
    expect(result.current.patientGrowth.map((p) => p.patients)).toEqual([10, 0, 5, 7, 20, 40]);
    expect(result.current.revenueData.slice(-2)).toEqual([
      { month: 'May', revenue: 24_000_000 },
      { month: 'Iyn', revenue: 48_000_000 },
    ]);
  });

  it('source pie from /analytics/sources', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.sourceData).toHaveLength(3));
    expect(result.current.sourceData.map(({ name, value }) => ({ name, value }))).toEqual([
      { name: 'Telegram', value: 2 },
      { name: 'Shaxsan', value: 1 },
      { name: 'Telefon', value: 1 },
    ]);
  });

  it('month-over-month trends from the last two monthly rows', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.newPatientsTrend).not.toBeNull());
    expect(result.current.newPatientsTrend).toEqual({ text: "+100% o'tgan oyga", up: true });
    expect(result.current.revenueTrend).toEqual({ text: "+100% o'tgan oyga", up: true });
  });

  it('recent bookings resolve patient and doctor names', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.patientsById.size).toBe(2));
    await waitFor(() => expect(result.current.doctorsById.size).toBe(2));
    expect(result.current.recentBookings.map((b) => b.id)).toEqual(['b1', 'b2']);
    expect(result.current.patientsById.get('p1')?.firstName).toBe('F-p1');
    expect(result.current.doctorsById.get('d2')?.lastName).toBe('Sobirov');
    expect(patientsApi.get).toHaveBeenCalledTimes(2);
    // doctor lookup never asks for more than 100 rows
    expect(doctorsApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
  });

  it('shows all four quick actions including finance', async () => {
    const { result } = setup();
    expect(result.current.quickActions.map((a) => a.path)).toEqual(['/bookings', '/patients', '/finance', '/doctors']);
  });

  it('zero figures when the backend has no data', async () => {
    vi.mocked(analyticsApi.monthly).mockResolvedValue([]);
    vi.mocked(analyticsApi.dashboard).mockResolvedValue({
      ...dashboard,
      totalPatients: 0,
      newPatientsThisMonth: 0,
      unpaidTotal: 0,
      unpaidCount: 0,
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      totalPatients: 0,
      totalDebt: 0,
      unpaidCount: 0,
      newPatients: 0,
      newPatientsTrend: null,
      revenueTrend: null,
    });
  });

  it('a failed /analytics/dashboard is an error state, not silent zeros', async () => {
    vi.mocked(analyticsApi.dashboard).mockRejectedValue(new ApiError(500, 'Server xatosi'));
    const { result } = setup();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
  });

  it('query keys include their params (no shared bare ["patients"]/["bookings"] keys)', async () => {
    const { result, queryClient } = setup();
    await waitFor(() => expect(result.current.patientsById.size).toBe(2));
    const keys = queryClient.getQueryCache().getAll().map((q) => q.queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ['analytics', 'dashboard', '2026-06-17'],
        ['analytics', 'monthly', 6],
        ['analytics', 'sources'],
        ['bookings', 'list', { limit: 5 }],
        ['doctors', 'lookup', {}],
        ['patients', 'p1'],
      ]),
    );
    for (const k of keys) {
      expect(k).not.toEqual(['patients']);
      expect(k).not.toEqual(['bookings']);
      expect(k).not.toEqual(['doctors']);
    }
  });
});

describe('useDashboard (non-admin)', () => {
  it('receptionist: money fields are null → shown as unavailable, finance action hidden', async () => {
    loginAs('receptionist');
    vi.mocked(analyticsApi.dashboard).mockResolvedValue({
      ...dashboard,
      todayRevenue: null,
      monthRevenue: null,
      monthExpenses: null,
      unpaidTotal: null,
      unpaidCount: null,
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(paymentsApi.list).not.toHaveBeenCalled();
    expect(result.current.canViewPayments).toBe(false);
    expect(result.current.monthRevenue).toBe(0);
    expect(result.current.revenueTrend).toBeNull();
    expect(result.current.quickActions.map((a) => a.path)).toEqual(['/bookings', '/patients']);
  });

  it('doctor: dashboard works via /analytics (no 403 from /doctors) and only allowed actions show', async () => {
    loginAs('doctor');
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.activeDoctors).toBe(3);
    expect(result.current.totalDoctors).toBe(7);
    // doctors cannot create bookings/patients/payments nor open /doctors
    expect(result.current.quickActions).toEqual([]);
  });

  it('logged out: nothing is fetched', async () => {
    loginAs(null);
    setup();
    await Promise.resolve();
    expect(analyticsApi.dashboard).not.toHaveBeenCalled();
    expect(bookingsApi.list).not.toHaveBeenCalled();
  });
});
