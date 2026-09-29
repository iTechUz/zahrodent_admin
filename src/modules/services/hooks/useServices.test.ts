import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { CATEGORIES, useServices } from './useServices';
import { useStore } from '@/store/useStore';
import { mockServices } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useServices', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('returns all services and unique categories from data', () => {
    const { result } = renderHook(() => useServices());
    expect(result.current.services).toHaveLength(mockServices.length);
    expect(result.current.categories).toEqual([...new Set(mockServices.map((s) => s.category))]);
    expect(result.current.filterCategory).toBe('all');
  });

  it('falls back to default CATEGORIES when there are no services', () => {
    useStore.setState({ services: [] });
    const { result } = renderHook(() => useServices());
    expect(result.current.categories).toBe(CATEGORIES);
    expect(result.current.groupedServices).toEqual({});
  });

  it('groups services by category', () => {
    const { result } = renderHook(() => useServices());
    expect(result.current.groupedServices['Jarrohlik'].map((s) => s.id)).toEqual(['s5', 's6']);
    const total = Object.values(result.current.groupedServices).reduce((n, l) => n + l.length, 0);
    expect(total).toBe(mockServices.length);
  });

  it('search matches name or category, case-insensitively', () => {
    const { result } = renderHook(() => useServices());
    act(() => result.current.setSearch('VINIR'));
    expect(result.current.services.map((s) => s.id)).toEqual(['s8']);
    act(() => result.current.setSearch('estetika'));
    expect(result.current.services.map((s) => s.id)).toEqual(['s8', 's10']);
  });

  it('category filter combines with search', () => {
    const { result } = renderHook(() => useServices());
    act(() => result.current.setFilterCategory('Diagnostika'));
    expect(result.current.services.map((s) => s.id)).toEqual(['s1', 's12']);
    act(() => result.current.setSearch('rentgen'));
    expect(result.current.services.map((s) => s.id)).toEqual(['s12']);
    expect(Object.keys(result.current.groupedServices)).toEqual(['Diagnostika']);
  });

  it('creates and updates services', () => {
    const { result } = renderHook(() => useServices());
    const data = { name: 'Yangi', category: 'Davolash', price: 100, duration: 10, description: '' };
    act(() => result.current.openCreate());
    act(() => result.current.handleSave(data));
    const created = useStore.getState().services.at(-1)!;
    expect(created).toMatchObject(data);
    expect(created.id).toMatch(/^s\d+$/);
    expect(toast.success).toHaveBeenCalledWith("Yangi xizmat qo'shildi");

    act(() => result.current.openEdit(mockServices[0]));
    act(() => result.current.handleSave({ ...data, name: 'Edited' }));
    expect(useStore.getState().services[0]).toMatchObject({ id: 's1', name: 'Edited' });
    expect(toast.success).toHaveBeenCalledWith('Xizmat yangilandi');
    expect(result.current.modalOpen).toBe(false);
  });

  it('deletes by deleteId, no-op without one', () => {
    const { result } = renderHook(() => useServices());
    act(() => result.current.handleDelete());
    expect(useStore.getState().services).toHaveLength(mockServices.length);
    act(() => result.current.setDeleteId('s2'));
    act(() => result.current.handleDelete());
    expect(useStore.getState().services.some((s) => s.id === 's2')).toBe(false);
    expect(result.current.deleteId).toBeNull();
  });
});
