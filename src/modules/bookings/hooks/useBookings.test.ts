import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useBookings } from './useBookings';
import { useStore } from '@/store/useStore';
import { mockBookings } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const form = {
  patientId: 'p1', doctorId: 'd2', date: '2024-05-01', time: '12:00',
  source: 'phone' as const, status: 'pending' as const, notes: '',
};

describe('useBookings', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('starts with status/source = all and first page of bookings', () => {
    const { result } = renderHook(() => useBookings());
    expect(result.current.filterStatus).toBe('all');
    expect(result.current.filterSource).toBe('all');
    expect(result.current.totalBookings).toBe(mockBookings.length);
    expect(result.current.bookings).toHaveLength(8);
    expect(result.current.totalPages).toBe(2);
  });

  it('search matches patient full name case-insensitively', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.setSearch('oisha KARIMOVA'));
    expect(result.current.bookings.map((b) => b.id)).toEqual(['b1']);
  });

  it('filters by status and source', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.setFilterStatus('pending'));
    expect(result.current.bookings.every((b) => b.status === 'pending')).toBe(true);
    expect(result.current.totalBookings).toBe(3);
    act(() => result.current.setFilterSource('telegram'));
    expect(result.current.bookings.map((b) => b.id)).toEqual(['b5']);
  });

  // BUG: when a booking's patient no longer exists the searched string becomes "undefined undefined",
  // so searching "undefined" matches orphaned bookings. useBookings.ts:30-31 (same in useFinance.ts:40-41)
  it.todo('does not match orphaned bookings when searching "undefined"');

  it('handleSave creates a new booking with generated id and createdAt', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-04-10T08:00:00Z'));
    const { result } = renderHook(() => useBookings());
    act(() => result.current.openCreate());
    expect(result.current.modalOpen).toBe(true);
    act(() => result.current.handleSave(form));
    vi.useRealTimers();
    const created = useStore.getState().bookings.at(-1)!;
    expect(created).toMatchObject({ ...form, createdAt: '2024-04-10' });
    expect(created.id).toBe(`b${new Date('2024-04-10T08:00:00Z').getTime()}`);
    expect(toast.success).toHaveBeenCalledWith('Yangi qabul yaratildi');
    expect(result.current.modalOpen).toBe(false);
  });

  it('handleSave updates the item being edited', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.openEdit(mockBookings[0]));
    expect(result.current.editing).toBe(mockBookings[0]);
    act(() => result.current.handleSave({ ...form, status: 'arrived' }));
    const b1 = useStore.getState().bookings.find((b) => b.id === 'b1');
    expect(b1).toMatchObject({ ...form, status: 'arrived', id: 'b1', createdAt: mockBookings[0].createdAt });
    expect(useStore.getState().bookings).toHaveLength(mockBookings.length);
    expect(toast.success).toHaveBeenCalledWith('Qabul muvaffaqiyatli yangilandi');
  });

  it('handleStatusChange updates status and toasts the Uzbek label', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.handleStatusChange('b2', 'no-show'));
    expect(useStore.getState().bookings.find((b) => b.id === 'b2')?.status).toBe('no-show');
    expect(toast.success).toHaveBeenCalledWith('Holat "Kelmadi" ga o\'zgartirildi');
  });

  it('handleDelete removes the pending id and clears it', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.setDeleteId('b3'));
    act(() => result.current.handleDelete());
    expect(useStore.getState().bookings.some((b) => b.id === 'b3')).toBe(false);
    expect(result.current.deleteId).toBeNull();
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('handleDelete without deleteId does nothing', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.handleDelete());
    expect(useStore.getState().bookings).toHaveLength(mockBookings.length);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('viewBooking state round-trips', () => {
    const { result } = renderHook(() => useBookings());
    act(() => result.current.setViewBooking(mockBookings[2]));
    expect(result.current.viewBooking).toBe(mockBookings[2]);
  });
});
