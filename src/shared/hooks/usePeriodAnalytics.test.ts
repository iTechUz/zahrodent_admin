import { describe, it, expect } from 'vitest';
import { resolvePeriod, ALL_TIME_START } from './usePeriodAnalytics';

const TODAY = '2026-11-02';

describe('resolvePeriod', () => {
  it('short periods are per day', () => {
    expect(resolvePeriod({ startDate: '2026-11-01' }, TODAY).daily).toBe(true);
    expect(resolvePeriod({ startDate: '2026-10-01', endDate: '2026-10-31' }, TODAY).daily).toBe(true);
    // exactly 92 days (Aug 2 – Nov 1 inclusive) is still daily
    expect(resolvePeriod({ startDate: '2026-08-02', endDate: '2026-11-01' }, TODAY).daily).toBe(true);
  });

  it('periods longer than 92 days are per month', () => {
    expect(resolvePeriod({ startDate: '2026-08-01', endDate: '2026-11-01' }, TODAY).daily).toBe(false);
    expect(resolvePeriod({ startDate: '2026-01-01' }, TODAY).daily).toBe(false);
  });

  it('no dates = all time (monthly from an early start)', () => {
    const r = resolvePeriod({}, TODAY);
    expect(r.allTime).toBe(true);
    expect(r.daily).toBe(false);
    expect(r.period.startDate).toBe(ALL_TIME_START);
  });
});
