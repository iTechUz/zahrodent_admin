import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { useDashboard } from './useDashboard';
import { useStore } from '@/store/useStore';
import { resetStore } from '@/test/resetStore';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>;

describe('useDashboard', () => {
  beforeEach(resetStore);

  it('computes KPIs from the mock data (today pinned to 2024-03-31)', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });
    const r = result.current;
    expect(r.todayBookings.map((b) => b.id)).toEqual(['b1', 'b2', 'b3', 'b4']);
    expect(r.totalRevenue).toBe(900000);
    expect(r.newPatients).toBe(8); // createdAt >= 2024-03-01
    expect(r.completedToday).toBe(0);
    expect(r.pendingBookings).toBe(3);
    expect(r.totalDebt).toBe(1850000);
    expect(r.unpaidCount).toBe(4);
    expect(r.activeDoctors).toBe(1); // d1 has an in-progress visit
    expect(typeof r.navigate).toBe('function');
  });

  it('quick actions point to existing routes', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });
    expect(result.current.quickActions.map((a) => a.path)).toEqual(['/bookings', '/patients', '/finance', '/doctors']);
  });

  it('reacts to store changes', () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });
    act(() => useStore.getState().updateBooking('b1', { status: 'completed' }));
    expect(result.current.completedToday).toBe(1);
    act(() => useStore.getState().updateVisit('v2', { status: 'completed' }));
    expect(result.current.activeDoctors).toBe(0);
  });

  it('empty store gives zeros', () => {
    act(() => useStore.setState({ patients: [], bookings: [], payments: [], doctors: [], visits: [] }));
    const { result } = renderHook(() => useDashboard(), { wrapper });
    const r = result.current;
    expect([r.todayBookings.length, r.totalRevenue, r.newPatients, r.pendingBookings, r.totalDebt, r.activeDoctors])
      .toEqual([0, 0, 0, 0, 0, 0]);
  });
});
