import { describe, expect, it } from 'vitest';
import { AnalyticsService, CONVERSION_DATA, MONTHLY_PATIENTS, REVENUE_GROWTH } from './analytics.service';
import { mockBookings } from '@/mock/data';
import { Booking } from '@/shared/types';

const b = (source: string): Booking =>
  ({ ...mockBookings[0], id: Math.random().toString(), source }) as Booking;

describe('AnalyticsService', () => {
  it('static getters return the mock series', () => {
    expect(AnalyticsService.getMonthlyPatients()).toBe(MONTHLY_PATIENTS);
    expect(AnalyticsService.getRevenueGrowth()).toBe(REVENUE_GROWTH);
    expect(AnalyticsService.getConversionData()).toBe(CONVERSION_DATA);
  });

  it('completed never exceeds booked in conversion data', () => {
    CONVERSION_DATA.forEach((m) => expect(m.completed).toBeLessThanOrEqual(m.booked));
  });

  it('processSourceData returns [] for no bookings', () => {
    expect(AnalyticsService.processSourceData([])).toEqual([]);
  });

  it('processSourceData counts per source with Uzbek labels in first-seen order', () => {
    expect(AnalyticsService.processSourceData([b('telegram'), b('phone'), b('telegram'), b('walk-in')])).toEqual([
      { name: 'Telegram', value: 2 },
      { name: 'Telefon', value: 1 },
      { name: 'Shaxsan', value: 1 },
    ]);
  });

  it('processSourceData over the mock bookings sums to the total', () => {
    const out = AnalyticsService.processSourceData(mockBookings);
    expect(out.reduce((s, x) => s + x.value, 0)).toBe(mockBookings.length);
    expect(out.map((x) => x.name).sort()).toEqual(['Shaxsan', 'Telefon', 'Telegram', 'Veb-sayt']);
  });

  it('processSourceData falls back to the raw key for unknown sources', () => {
    expect(AnalyticsService.processSourceData([b('instagram')])).toEqual([{ name: 'instagram', value: 1 }]);
  });

  it('getChartColors returns 4 hsl colours', () => {
    const c = AnalyticsService.getChartColors();
    expect(c).toHaveLength(4);
    c.forEach((x) => expect(x).toMatch(/^hsl\(/));
  });
});
