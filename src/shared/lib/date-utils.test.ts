import { getMonthToDateRange } from './date-utils';

afterEach(() => {
  vi.useRealTimers();
});

describe('getMonthToDateRange', () => {
  it('returns the 1st of the current (local) month and an open end date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 14, 30));
    expect(getMonthToDateRange()).toEqual({ startDate: '2026-06-01', endDate: '' });
  });

  it('zero-pads single-digit months', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 23, 59));
    expect(getMonthToDateRange().startDate).toBe('2026-01-01');
  });

  it('uses local date parts, not UTC (no shift right after local midnight)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1, 0, 5));
    expect(getMonthToDateRange().startDate).toBe('2026-03-01');
  });
});
