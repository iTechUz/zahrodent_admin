import { renderHook, waitFor } from '@testing-library/react';
import { bookingsApi, doctorsApi, patientsApi, paymentsApi, visitsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient, Payment, Visit } from '@/shared/types';
import { useDashboard } from './useDashboard';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const patients = [
  { id: 'p1', createdAt: '2026-06-05' },
  { id: 'p2', createdAt: '2026-06-01' },
  { id: 'p3', createdAt: '2026-05-20' },
  { id: 'p4', createdAt: '2026-01-10' },
] as Patient[];

const bookings = [
  { id: 'b1', date: '2026-06-17', status: 'completed', source: 'telegram' },
  { id: 'b2', date: '2026-06-17', status: 'pending', source: 'telegram' },
  { id: 'b3', date: '2026-06-16', status: 'pending', source: 'walk-in' },
  { id: 'b4', date: '2026-05-01', status: 'cancelled', source: 'phone' },
] as Booking[];

const payments = [
  { id: 'x1', date: '2026-06-10', amount: 100, status: 'paid' },
  { id: 'x2', date: '2026-05-10', amount: 50, status: 'paid' },
  { id: 'x3', date: '2026-06-11', amount: 30, status: 'unpaid' },
  { id: 'x4', date: '2026-06-12', amount: 20, status: 'partial' },
] as Payment[];

const doctors = [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }] as Doctor[];

const visits = [
  { id: 'v1', doctorId: 'd1', status: 'in-progress' },
  { id: 'v2', doctorId: 'd1', status: 'in-progress' },
  { id: 'v3', doctorId: 'd2', status: 'completed' },
] as Visit[];

function setup() {
  const { wrapper } = createWrapper(undefined, { router: true });
  return renderHook(() => useDashboard(), { wrapper });
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T12:00:00.000Z')); // midday UTC keeps monthStart/today stable from UTC-11 to UTC+14
  vi.mocked(patientsApi.list).mockResolvedValue(paginated(patients));
  vi.mocked(bookingsApi.list).mockResolvedValue(paginated(bookings));
  vi.mocked(paymentsApi.list).mockResolvedValue(paginated(payments));
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated(doctors));
  vi.mocked(visitsApi.list).mockResolvedValue(paginated(visits));
});

afterEach(() => vi.useRealTimers());

describe('useDashboard (admin)', () => {
  beforeEach(() => loginAs('admin'));

  it('fetches every list with its limit', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(patientsApi.list).toHaveBeenCalledWith({ limit: 300 });
    expect(bookingsApi.list).toHaveBeenCalledWith({ limit: 300 });
    expect(paymentsApi.list).toHaveBeenCalledWith({ limit: 300 });
    expect(doctorsApi.list).toHaveBeenCalledWith({ limit: 100 });
    expect(visitsApi.list).toHaveBeenCalledWith({ limit: 300 });
  });

  it('computes the headline figures', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.payments).toHaveLength(4));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const r = result.current;
    expect(r.todayBookings.map((b) => b.id)).toEqual(['b1', 'b2']);
    expect(r.completedToday).toBe(1);
    expect(r.pendingBookings).toBe(2);
    expect(r.newPatients).toBe(2);
    expect(r.totalRevenue).toBe(150); // paid only
    expect(r.totalDebt).toBe(50); // unpaid + partial
    expect(r.unpaidCount).toBe(2);
    expect(r.activeDoctors).toBe(1); // distinct doctors with an in-progress visit
    expect(r.canViewPayments).toBe(true);
    expect(typeof r.navigate).toBe('function');
  });

  it('builds 6-month chart series ending with the current month', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.payments).toHaveLength(4));
    const r = result.current;
    expect(r.patientGrowth.map((p) => p.month)).toEqual(['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn']);
    expect(r.patientGrowth.map((p) => p.patients)).toEqual([1, 0, 0, 0, 1, 2]);
    expect(r.revenueData.slice(-2)).toEqual([
      { month: 'May', revenue: 50 },
      { month: 'Iyn', revenue: 100 },
    ]);
    expect(r.sourceData.map(({ name, value }) => ({ name, value }))).toEqual([
      { name: 'Telegram', value: 2 },
      { name: 'Shaxsan', value: 1 },
      { name: 'Telefon', value: 1 },
    ]);
  });

  it('month-over-month trends', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.payments).toHaveLength(4));
    expect(result.current.newPatientsTrend).toEqual({ text: "+100% o'tgan oyga", up: true });
    expect(result.current.revenueTrend).toEqual({ text: "+100% o'tgan oyga", up: true });
  });

  it('shows all four quick actions including finance', async () => {
    const { result } = setup();
    expect(result.current.quickActions.map((a) => a.path)).toEqual(['/bookings', '/patients', '/finance', '/doctors']);
  });

  it('returns zeroed figures with empty data', async () => {
    resetApiMock();
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      totalRevenue: 0,
      totalDebt: 0,
      unpaidCount: 0,
      newPatients: 0,
      activeDoctors: 0,
      newPatientsTrend: null,
      revenueTrend: null,
    });
  });
});

describe('useDashboard (non-admin)', () => {
  it.each(['receptionist', 'doctor'] as const)('%s: payments are not requested and finance action is hidden', async (role) => {
    loginAs(role);
    const { result } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(paymentsApi.list).not.toHaveBeenCalled();
    expect(result.current.canViewPayments).toBe(false);
    expect(result.current.totalRevenue).toBe(0);
    expect(result.current.quickActions.map((a) => a.path)).not.toContain('/finance');
    expect(result.current.quickActions).toHaveLength(3);
  });

  it('logged out: nothing is fetched', async () => {
    loginAs(null);
    setup();
    await Promise.resolve();
    expect(patientsApi.list).not.toHaveBeenCalled();
    expect(bookingsApi.list).not.toHaveBeenCalled();
  });
});

describe('useDashboard known bugs', () => {
  it.todo(
    'BUG: src/modules/dashboard/hooks/useDashboard.ts:22,38 — `today`/`monthStart` come from toISOString() (UTC); in ' +
      'Asia/Tashkent 00:00–04:59 "today" is yesterday, so todayBookings/completedToday are wrong for the first 5 hours',
  );
  it.todo(
    'BUG: src/modules/dashboard/hooks/useDashboard.ts:41-75 — lists use the bare queryKeys.patients/bookings/payments/doctors ' +
      '(["patients"] …) which are shared with useBookings/useFinance/useDoctors/useAnalytics/usePatientProfile that fetch ' +
      'with other limits (1000, 100, none=10); whichever mounts first fills the cache, so dashboard figures depend on navigation order. ' +
      'Include the params in the key',
  );
  it.todo(
    'BUG: src/modules/dashboard/hooks/useDashboard.ts:76-85 — revenue/debt/new-patient totals are computed client-side from ' +
      'the first 300 rows only; use the /payments/stats, /patients/stats, /bookings/stats endpoints instead',
  );
  it.todo(
    'BUG: src/modules/dashboard/hooks/useDashboard.ts:62-66 — GET /doctors is admin/receptionist only (backend ' +
      'doctors.controller.ts:31); for the doctor role it 403s and activeDoctors is always 0',
  );
});
