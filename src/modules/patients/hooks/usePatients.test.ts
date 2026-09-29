import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { usePatients } from './usePatients';
import { useStore } from '@/store/useStore';
import { mockPatients } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const form = { firstName: 'Ali', lastName: 'Valiyev', phone: '+998 90 000 0000', age: 30, source: 'walk-in' as const };

describe('usePatients', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('paginates patients 8 per page', () => {
    const { result } = renderHook(() => usePatients());
    expect(result.current.totalPatients).toBe(mockPatients.length);
    expect(result.current.patients).toHaveLength(8);
    expect(result.current.totalPages).toBe(Math.ceil(mockPatients.length / 8));
  });

  it('searches by name', () => {
    const { result } = renderHook(() => usePatients());
    act(() => result.current.setSearch('rustam'));
    expect(result.current.patients.map((p) => p.id)).toEqual(['p2']);
  });

  it('searches by phone fragment', () => {
    const { result } = renderHook(() => usePatients());
    act(() => result.current.setSearch('234 5678'));
    expect(result.current.patients.map((p) => p.id)).toEqual(['p2']);
  });

  it('creates a new patient', () => {
    const { result } = renderHook(() => usePatients());
    act(() => result.current.openCreate());
    act(() => result.current.handleSave(form));
    const created = useStore.getState().patients.at(-1)!;
    expect(created).toMatchObject(form);
    expect(created.id).toMatch(/^p\d+$/);
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toast.success).toHaveBeenCalledWith("Yangi bemor qo'shildi");
    expect(result.current.modalOpen).toBe(false);
  });

  it('updates the patient being edited', () => {
    const { result } = renderHook(() => usePatients());
    act(() => result.current.openEdit(mockPatients[0]));
    expect(result.current.modalOpen).toBe(true);
    act(() => result.current.handleSave(form));
    expect(useStore.getState().patients[0]).toMatchObject({ ...form, id: 'p1' });
    expect(toast.success).toHaveBeenCalledWith("Bemor ma'lumotlari yangilandi");
  });

  it('deletes via deleteId and ignores when unset', () => {
    const { result } = renderHook(() => usePatients());
    act(() => result.current.handleDelete());
    expect(useStore.getState().patients).toHaveLength(mockPatients.length);
    act(() => result.current.setDeleteId('p1'));
    act(() => result.current.handleDelete());
    expect(useStore.getState().patients.some((p) => p.id === 'p1')).toBe(false);
    expect(result.current.deleteId).toBeNull();
  });
});
