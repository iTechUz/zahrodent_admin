import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

describe('useAnalytics', () => {
  beforeEach(resetStore);

  it('derives source data from store bookings', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(result.current.sourceData.reduce((s, x) => s + x.value, 0)).toBe(mockBookings.length);
    expect(result.current.colors).toHaveLength(4);
    expect(result.current.monthlyPatients).toHaveLength(6);
    expect(result.current.revenueGrowth).toHaveLength(6);
    expect(result.current.conversionData).toHaveLength(6);
  });

  it('updates when bookings change', () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => useStore.setState({ bookings: [mockBookings[0]] }));
    expect(result.current.sourceData).toEqual([{ name: 'Telegram', value: 1 }]);
  });
});
