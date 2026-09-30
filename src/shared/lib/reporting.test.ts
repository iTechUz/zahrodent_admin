import type { Booking, MonthlyAnalyticsRow, Patient, Payment } from '@/shared/types';
import {
  REPORT_CHART_COLORS,
  aggregateBookingConversionByMonth,
  aggregateBookingsBySourceLabel,
  aggregateBookingsBySourceWithColors,
  aggregateNewPatientsByMonthCounts,
  aggregateNewPatientsByMonthForDashboard,
  aggregatePaidRevenueByMonthSom,
  aggregatePaidRevenueMillions,
  countNewPatientsInMonthKeys,
  getLastNCalendarMonths,
  lastTwoMonths,
  monthLabel,
  monthlyConversionSeries,
  monthlyPatientSeries,
  monthlyRevenueSeries,
  monthOverMonthHint,
  sourceChartData,
  paidRevenueInMonthKeys,
} from './reporting';

const patient = (createdAt: string) => ({ id: createdAt, createdAt }) as Patient;
const payment = (date: string, amount: number, status: Payment['status'] = 'paid') =>
  ({ id: `${date}-${amount}`, date, amount, status }) as Payment;
const booking = (date: string, status: Booking['status'] = 'pending', source: Booking['source'] = 'phone') =>
  ({ id: `${date}-${status}`, date, status, source }) as Booking;

const REF = new Date(2026, 5, 15); // June 2026
const buckets = getLastNCalendarMonths(3, REF); // Apr, May, Jun

describe('getLastNCalendarMonths', () => {
  it('returns n buckets, oldest first, ending with the reference month', () => {
    expect(buckets).toEqual([
      { key: '2026-04', label: 'Apr' },
      { key: '2026-05', label: 'May' },
      { key: '2026-06', label: 'Iyn' },
    ]);
  });

  it('crosses year boundaries', () => {
    expect(getLastNCalendarMonths(3, new Date(2026, 0, 10))).toEqual([
      { key: '2025-11', label: 'Noy' },
      { key: '2025-12', label: 'Dek' },
      { key: '2026-01', label: 'Yan' },
    ]);
  });

  it('returns [] for n = 0', () => {
    expect(getLastNCalendarMonths(0, REF)).toEqual([]);
  });
});

describe('patients by month', () => {
  const patients = [
    patient('2026-04-02'),
    patient('2026-06-01'),
    patient('2026-06-30T10:00:00.000Z'),
    patient('2025-06-15'), // same month, previous year → outside window
  ];

  it('dashboard shape counts patients per bucket (0 for empty months)', () => {
    expect(aggregateNewPatientsByMonthForDashboard(patients, buckets)).toEqual([
      { month: 'Apr', patients: 1 },
      { month: 'May', patients: 0 },
      { month: 'Iyn', patients: 2 },
    ]);
  });

  it('analytics shape renames to count', () => {
    expect(aggregateNewPatientsByMonthCounts(patients, buckets)).toEqual([
      { month: 'Apr', count: 1 },
      { month: 'May', count: 0 },
      { month: 'Iyn', count: 2 },
    ]);
  });
});

describe('revenue by month', () => {
  const payments = [
    payment('2026-05-03', 1_000_000),
    payment('2026-05-20', 250_000),
    payment('2026-05-21', 999_999, 'unpaid'),
    payment('2026-05-22', 500_000, 'partial'),
    payment('2026-06-01', 1_540_000),
    payment('2026-01-01', 7_000_000), // outside window
  ];

  it('sums only paid payments, in so\'m', () => {
    expect(aggregatePaidRevenueByMonthSom(payments, buckets)).toEqual([
      { month: 'Apr', revenue: 0 },
      { month: 'May', revenue: 1_250_000 },
      { month: 'Iyn', revenue: 1_540_000 },
    ]);
  });

  it('converts to millions rounded to 1 decimal', () => {
    expect(aggregatePaidRevenueMillions(payments, buckets)).toEqual([
      { month: 'Apr', revenue: 0 },
      { month: 'May', revenue: 1.3 },
      { month: 'Iyn', revenue: 1.5 },
    ]);
  });
});

describe('aggregateBookingConversionByMonth', () => {
  it('counts booked and completed per month, ignoring bookings outside the window', () => {
    const bookings = [
      booking('2026-05-01', 'completed'),
      booking('2026-05-02', 'pending'),
      booking('2026-05-03', 'cancelled'),
      booking('2026-06-10', 'completed'),
      booking('2026-02-10', 'completed'),
    ];
    expect(aggregateBookingConversionByMonth(bookings, buckets)).toEqual([
      { month: 'Apr', booked: 0, completed: 0 },
      { month: 'May', booked: 3, completed: 1 },
      { month: 'Iyn', booked: 1, completed: 1 },
    ]);
  });
});

describe('bookings by source', () => {
  const bookings = [
    booking('2026-06-01', 'pending', 'telegram'),
    booking('2026-06-02', 'pending', 'telegram'),
    booking('2026-06-03', 'pending', 'walk-in'),
    { ...booking('2026-06-04'), source: 'instagram' } as unknown as Booking,
  ];

  it('maps sources to Uzbek labels, keeping unknown sources as-is', () => {
    expect(aggregateBookingsBySourceLabel(bookings)).toEqual([
      { name: 'Telegram', value: 2 },
      { name: 'Shaxsan', value: 1 },
      { name: 'instagram', value: 1 },
    ]);
  });

  it('assigns palette colours in order, cycling when exhausted', () => {
    const rows = aggregateBookingsBySourceWithColors(bookings);
    expect(rows.map((r) => r.color)).toEqual(REPORT_CHART_COLORS.slice(0, 3));

    const many = ['walk-in', 'telegram', 'website', 'phone', 'a', 'b', 'c'].map(
      (s) => ({ ...booking('2026-06-01'), source: s }) as unknown as Booking,
    );
    const colored = aggregateBookingsBySourceWithColors(many);
    expect(colored[6].color).toBe(REPORT_CHART_COLORS[0]);
  });

  it('returns [] for no bookings', () => {
    expect(aggregateBookingsBySourceLabel([])).toEqual([]);
  });
});

describe('month-over-month helpers', () => {
  it('countNewPatientsInMonthKeys', () => {
    const patients = [patient('2026-06-01'), patient('2026-06-02'), patient('2026-05-31'), patient('2026-04-01')];
    expect(countNewPatientsInMonthKeys(patients, '2026-06', '2026-05')).toEqual({ current: 2, previous: 1 });
  });

  it('paidRevenueInMonthKeys ignores non-paid', () => {
    const payments = [
      payment('2026-06-01', 100),
      payment('2026-06-02', 50, 'partial'),
      payment('2026-05-10', 40),
      payment('2026-04-10', 1000),
    ];
    expect(paidRevenueInMonthKeys(payments, '2026-06', '2026-05')).toEqual({ current: 100, previous: 40 });
  });

  describe('monthOverMonthHint', () => {
    it('returns null when both are zero', () => {
      expect(monthOverMonthHint(0, 0)).toBeNull();
    });

    it('shows the current value when there is no previous month', () => {
      expect(monthOverMonthHint(5, 0)).toEqual({ text: 'Joriy davr: 5', up: true });
    });

    it('shows a signed, rounded percentage', () => {
      expect(monthOverMonthHint(15, 10)).toEqual({ text: "+50% o'tgan oyga", up: true });
      expect(monthOverMonthHint(10, 10)).toEqual({ text: "+0% o'tgan oyga", up: true });
      expect(monthOverMonthHint(2, 3)).toEqual({ text: "-33% o'tgan oyga", up: false });
      expect(monthOverMonthHint(0, 4)).toEqual({ text: "-100% o'tgan oyga", up: false });
    });
  });
});

describe('backend analytics adapters', () => {
  const rows: MonthlyAnalyticsRow[] = [
    { month: '2025-12', newPatients: 3, bookings: 10, completedBookings: 7, revenue: 1_250_000, expenses: 100 },
    { month: '2026-01', newPatients: 5, bookings: 12, completedBookings: 9, revenue: 2_340_000, expenses: null },
  ];

  it('monthLabel maps YYYY-MM to the Uzbek short month', () => {
    expect(monthLabel('2026-01')).toBe('Yan');
    expect(monthLabel('2026-12')).toBe('Dek');
    expect(monthLabel('bad')).toBe('bad');
  });

  it('patient / conversion series', () => {
    expect(monthlyPatientSeries(rows)).toEqual([
      { month: 'Dek', patients: 3 },
      { month: 'Yan', patients: 5 },
    ]);
    expect(monthlyConversionSeries(rows)).toEqual([
      { month: 'Dek', booked: 10, completed: 7 },
      { month: 'Yan', booked: 12, completed: 9 },
    ]);
  });

  it("revenue series in so'm and in millions; null (non-admin) → 0", () => {
    expect(monthlyRevenueSeries(rows)).toEqual([
      { month: 'Dek', revenue: 1_250_000 },
      { month: 'Yan', revenue: 2_340_000 },
    ]);
    expect(monthlyRevenueSeries(rows, 'mln').map((r) => r.revenue)).toEqual([1.3, 2.3]);
    expect(monthlyRevenueSeries([{ ...rows[0], revenue: null }])[0].revenue).toBe(0);
  });

  it('lastTwoMonths compares the two newest rows', () => {
    expect(lastTwoMonths(rows, 'newPatients')).toEqual({ current: 5, previous: 3 });
    expect(lastTwoMonths(rows, 'revenue')).toEqual({ current: 2_340_000, previous: 1_250_000 });
    expect(lastTwoMonths([], 'revenue')).toEqual({ current: 0, previous: 0 });
  });

  it('sourceChartData labels sources, colours them and drops zero rows', () => {
    expect(
      sourceChartData([
        { source: 'telegram', count: 4 },
        { source: 'phone', count: 0 },
        { source: 'instagram', count: 1 },
      ]),
    ).toEqual([
      { name: 'Telegram', value: 4, color: REPORT_CHART_COLORS[0] },
      { name: 'instagram', value: 1, color: REPORT_CHART_COLORS[1] },
    ]);
  });
});
