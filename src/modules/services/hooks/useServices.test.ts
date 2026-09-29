import { act, renderHook, waitFor } from '@testing-library/react';
import { servicesApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { Service } from '@/shared/types';
import { CATEGORIES, useServices } from './useServices';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const api = vi.mocked(servicesApi);

const svc = (id: string, category: string): Service => ({ id, name: id, category, price: 1000, duration: 30 });

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => useServices(), { wrapper }), invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('admin');
});

describe('useServices', () => {
  it('lists with perPage 20 and category=all', async () => {
    api.list.mockResolvedValue(paginated([svc('a', 'Davolash')], 45));
    const { result } = setup();
    await waitFor(() => expect(result.current.services).toHaveLength(1));
    expect(api.list).toHaveBeenCalledWith({ page: 0, limit: 20, search: '', category: 'all' });
    expect(result.current.totalCount).toBe(45);
    expect(result.current.totalPages).toBe(3);
  });

  it('groups the current page by category', async () => {
    api.list.mockResolvedValue(
      paginated([svc('a', 'Davolash'), svc('b', 'Xirurgiya'), svc('c', 'Davolash')]),
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.services).toHaveLength(3));
    expect(result.current.groupedServices).toEqual({
      Davolash: [svc('a', 'Davolash'), svc('c', 'Davolash')],
      Xirurgiya: [svc('b', 'Xirurgiya')],
    });
  });

  it('exposes the static category list', () => {
    const { result } = setup();
    expect(result.current.categories).toBe(CATEGORIES);
    expect(CATEGORIES).toEqual(['Davolash', 'Ortodontiya', 'Xirurgiya', 'Gigiyena']);
  });

  it('category filter is sent to the backend', async () => {
    const { result } = setup();
    act(() => result.current.setFilters('category', 'Gigiyena'));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Gigiyena' })));
  });

  it('loads stats', async () => {
    api.stats.mockResolvedValue({ totalCount: 3, categoriesCount: 2, avgPrice: 5 });
    const { result } = setup();
    await waitFor(() => expect(result.current.stats).toEqual({ totalCount: 3, categoriesCount: 2, avgPrice: 5 }));
  });

  it.todo(
    'BUG: src/modules/services/hooks/useServices.ts:30-34 — GET /services/stats is admin-only (backend services.controller.ts:36) ' +
      'but receptionists can open /services, so the stats request always 403s for them',
  );

  it('create / update / delete invalidate ["services"] and toast', async () => {
    api.create.mockResolvedValue(svc('n', 'Davolash'));
    api.update.mockResolvedValue(svc('a', 'Davolash'));
    api.remove.mockResolvedValue({ id: 'a' });
    const { result, invalidate } = setup();
    const data = { name: 'Plomba', category: 'Davolash', price: 1, duration: 30, description: '' };

    act(() => result.current.openCreate());
    act(() => result.current.handleSave(data));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Yangi xizmat qo'shildi"));
    expect(api.create.mock.calls[0][0]).toEqual(data);
    expect(result.current.modalOpen).toBe(false);

    act(() => result.current.openEdit(svc('a', 'Davolash')));
    act(() => result.current.handleSave({ ...data, price: 2 }));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Xizmat yangilandi'));
    expect(api.update).toHaveBeenCalledWith('a', { ...data, price: 2 });

    act(() => result.current.setDeleteId('a'));
    act(() => result.current.handleDelete());
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Xizmat o'chirildi"));
    expect(api.remove.mock.calls[0][0]).toBe('a');
    expect(result.current.deleteId).toBeNull();

    expect(invalidate).toHaveBeenCalledTimes(3);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['services'] });
  });

  it('handleDelete without deleteId is a no-op', () => {
    const { result } = setup();
    act(() => result.current.handleDelete());
    expect(api.remove).not.toHaveBeenCalled();
  });
});
