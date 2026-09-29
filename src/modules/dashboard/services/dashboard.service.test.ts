import { describe, expect, it } from 'vitest';
import {
  DashboardService,
  DASHBOARD_MOCK_PATIENT_GROWTH,
  DASHBOARD_MOCK_REVENUE_DATA,
  DASHBOARD_MOCK_SOURCE_DATA,
} from './dashboard.service';

describe('DashboardService', () => {
  it('returns the static series', () => {
    expect(DashboardService.getPatientGrowth()).toBe(DASHBOARD_MOCK_PATIENT_GROWTH);
    expect(DashboardService.getRevenueData()).toBe(DASHBOARD_MOCK_REVENUE_DATA);
    expect(DashboardService.getSourceData()).toBe(DASHBOARD_MOCK_SOURCE_DATA);
  });

  it('source shares add up to 100%', () => {
    expect(DASHBOARD_MOCK_SOURCE_DATA.reduce((s, x) => s + x.value, 0)).toBe(100);
  });

  it('series cover the same six months', () => {
    expect(DASHBOARD_MOCK_PATIENT_GROWTH.map((m) => m.month)).toEqual(DASHBOARD_MOCK_REVENUE_DATA.map((m) => m.month));
    expect(DASHBOARD_MOCK_PATIENT_GROWTH).toHaveLength(6);
  });
});
