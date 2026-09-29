import {
  addDaysToDate,
  addMonthsToDate,
  clinicMonthKey,
  clinicMonthStart,
  clinicToday,
  getMonthToDateRange,
  toClinicDate,
} from './date-utils';

afterEach(() => {
  vi.useRealTimers();
});

describe('getMonthToDateRange', () => {
  it('returns the 1st of the current clinic month and an open end date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:30:00Z'));
    expect(getMonthToDateRange()).toEqual({ startDate: '2026-06-01', endDate: '' });
  });

  it('zero-pads single-digit months', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    expect(getMonthToDateRange().startDate).toBe('2026-01-01');
  });

  it('uses the Tashkent date right after Tashkent midnight (UTC is still the previous month)', () => {
    vi.useFakeTimers();
    // 2026-03-01 00:05 in Tashkent == 2026-02-28 19:05Z
    vi.setSystemTime(new Date('2026-02-28T19:05:00Z'));
    expect(getMonthToDateRange().startDate).toBe('2026-03-01');
  });
});

describe('clinic dates (Asia/Tashkent, UTC+5)', () => {
  it.each([
    ['2026-06-16T18:59:59Z', '2026-06-16'], // 23:59:59 Tashkent
    ['2026-06-16T19:00:00Z', '2026-06-17'], // 00:00 Tashkent — toISOString() would still say 06-16
    ['2026-06-16T23:59:00Z', '2026-06-17'], // 04:59 Tashkent
    ['2026-06-17T05:00:00Z', '2026-06-17'],
  ])('toClinicDate(%s) → %s', (iso, expected) => {
    expect(toClinicDate(new Date(iso))).toBe(expected);
  });

  it('clinicToday uses the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-31T20:00:00Z')); // 01:00 on Jan 1 in Tashkent
    expect(clinicToday()).toBe('2027-01-01');
    expect(clinicMonthStart()).toBe('2027-01-01');
    expect(clinicMonthKey()).toBe('2027-01');
  });

  it('addDaysToDate does calendar arithmetic across month/year ends', () => {
    expect(addDaysToDate('2026-06-17', 1)).toBe('2026-06-18');
    expect(addDaysToDate('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDaysToDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysToDate('2026-06-17', 0)).toBe('2026-06-17');
  });
});

describe('addMonthsToDate', () => {
  it('adds months and clamps to the month end', () => {
    expect(addMonthsToDate('2026-06-17', 1)).toBe('2026-07-17');
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonthsToDate('2026-03-31', -1)).toBe('2026-02-28');
  });
});
