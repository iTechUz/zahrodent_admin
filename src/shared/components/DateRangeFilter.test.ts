import { describe, it, expect } from 'vitest';
import { detectPreset, presetRange } from './DateRangeFilter';

const NOW = new Date('2026-11-15T08:00:00Z');

describe('DateRangeFilter presets', () => {
  it('computes ranges in the clinic time zone', () => {
    expect(presetRange('today', NOW)).toEqual({ startDate: '2026-11-15', endDate: '2026-11-15' });
    expect(presetRange('week', NOW)).toEqual({ startDate: '2026-11-09', endDate: '2026-11-15' });
    expect(presetRange('month', NOW)).toEqual({ startDate: '2026-11-01', endDate: undefined });
    expect(presetRange('lastMonth', NOW)).toEqual({ startDate: '2026-10-01', endDate: '2026-10-31' });
    expect(presetRange('year', NOW)).toEqual({ startDate: '2026-01-01', endDate: undefined });
    expect(presetRange('all', NOW)).toEqual({ startDate: undefined, endDate: undefined });
  });

  it('handles January for lastMonth', () => {
    expect(presetRange('lastMonth', new Date('2027-01-10T08:00:00Z'))).toEqual({
      startDate: '2026-12-01',
      endDate: '2026-12-31',
    });
  });

  it('detects the preset from a range, treating empty end as open', () => {
    expect(detectPreset({}, NOW)).toBe('all');
    expect(detectPreset({ startDate: '2026-11-01', endDate: '' }, NOW)).toBe('month');
    expect(detectPreset({ startDate: '2026-11-03', endDate: '2026-11-04' }, NOW)).toBe('custom');
  });
});
