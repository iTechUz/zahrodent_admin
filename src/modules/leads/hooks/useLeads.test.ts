import { act, renderHook, waitFor } from '@testing-library/react';
import { leadsApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { Lead } from '@/shared/types';
import { useLeads } from './useLeads';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const api = vi.mocked(leadsApi);

const lead: Lead = {
  id: 'l1',
  name: 'Ali',
  phone: '+998901112233',
  status: 'new',
  source: 'website',
  createdAt: '2026-06-01',
  updatedAt: '2026-06-01',
};

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => useLeads(), { wrapper }), invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('receptionist');
});

describe('useLeads', () => {
  it('lists leads with perPage 20 and no initial filters', async () => {
    api.list.mockResolvedValue(paginated([lead], 41));
    const { result } = setup();
    await waitFor(() => expect(result.current.leads).toEqual([lead]));
    expect(api.list).toHaveBeenCalledWith({ page: 0, limit: 20, search: '' });
    expect(result.current.totalCount).toBe(41);
    expect(result.current.totalPages).toBe(3);
  });

  it('setFilters(key, value) sends status / date filters', async () => {
    const { result } = setup();
    act(() => result.current.setFilters('status', 'contacted'));
    act(() => result.current.setFilters('startDate', '2026-06-01'));
    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith({ page: 0, limit: 20, search: '', status: 'contacted', startDate: '2026-06-01' }),
    );
  });

  it('setStatusFilter (the page status select) sends status and "all" clears it', async () => {
    const { result } = setup();
    act(() => result.current.setStatusFilter('consultation'));
    expect(result.current.filters).toEqual({ status: 'consultation' });
    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith({ page: 0, limit: 20, search: '', status: 'consultation' }),
    );
    act(() => result.current.setStatusFilter('all'));
    expect(result.current.filters).toEqual({ status: undefined });
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ page: 0, limit: 20, search: '', status: undefined }));
  });

  it('updateStatus → PATCH /leads/:id/status, invalidate ["leads"], toast', async () => {
    api.updateStatus.mockResolvedValue({ ...lead, status: 'converted' });
    const { result, invalidate } = setup();
    act(() => result.current.updateStatus({ id: 'l1', status: 'converted' }));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Murojaat holati yangilandi'));
    expect(api.updateStatus).toHaveBeenCalledWith('l1', 'converted');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] });
  });

  it('isUpdating reflects the pending status mutation', async () => {
    let resolve!: (l: Lead) => void;
    api.updateStatus.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = setup();
    act(() => result.current.updateStatus({ id: 'l1', status: 'contacted' }));
    await waitFor(() => expect(result.current.isUpdating).toBe(true));
    await act(async () => resolve(lead));
    await waitFor(() => expect(result.current.isUpdating).toBe(false));
  });

  it('createLead → POST /leads', async () => {
    api.create.mockResolvedValue(lead);
    const { result, invalidate } = setup();
    act(() => result.current.createLead({ name: 'Ali', phone: '+998901112233' }));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Yangi murojaat qo'shildi"));
    expect(api.create.mock.calls[0][0]).toEqual({ name: 'Ali', phone: '+998901112233' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] });
  });

  it('updateLead splits id from the body', async () => {
    api.update.mockResolvedValue(lead);
    const { result } = setup();
    act(() => result.current.updateLead({ id: 'l1', notes: 'qayta qo‘ng‘iroq', status: 'contacted' }));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Murojaat yangilandi'));
    expect(api.update).toHaveBeenCalledWith('l1', { notes: 'qayta qo‘ng‘iroq', status: 'contacted' });
  });

  it('deleteLead → DELETE /leads/:id and isDeleting', async () => {
    let resolve!: (v: { id: string }) => void;
    api.remove.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result, invalidate } = setup();
    act(() => result.current.deleteLead('l1'));
    await waitFor(() => expect(result.current.isDeleting).toBe(true));
    await act(async () => resolve({ id: 'l1' }));
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Murojaat o'chirildi"));
    expect(api.remove.mock.calls[0][0]).toBe('l1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] });
  });
});
