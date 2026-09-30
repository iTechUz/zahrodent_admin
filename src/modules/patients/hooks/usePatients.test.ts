import { act, renderHook, waitFor } from '@testing-library/react';
import { patientsApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import { ApiError } from '@/lib/api/client';
import { createQueryClient } from '@/lib/api/query-client';
import type { Patient } from '@/shared/types';
import type { PatientFormValues } from '@/shared/lib/validation';
import { usePatients } from './usePatients';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const api = vi.mocked(patientsApi);

const patient = {
  id: 'p1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  age: 30,
  phone: '+998901112233',
  address: 'Toshkent',
  workplace: 'IT',
  source: 'walk-in',
  notes: '',
  createdAt: '2026-06-01',
} as Patient;

const form: PatientFormValues = {
  firstName: 'Ali',
  lastName: 'Valiyev',
  phone: '+998901112233',
  age: 30,
  address: 'Toshkent',
  workplace: 'IT',
  source: 'walk-in',
};

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const hook = renderHook(() => usePatients(), { wrapper });
  return { ...hook, queryClient, invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 17, 12, 0));
  loginAs('admin');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePatients', () => {
  describe('list', () => {
    it('requests page 0 / limit 10 with month-to-date + source=all filters', async () => {
      api.list.mockResolvedValue(paginated([patient], 23));
      const { result } = setup();
      await waitFor(() => expect(result.current.patients).toEqual([patient]));
      expect(api.list).toHaveBeenCalledWith({
        page: 0,
        limit: 10,
        search: '',
        startDate: '2026-06-01',
        endDate: '',
        source: 'all',
      });
      expect(result.current.totalPatients).toBe(23);
      expect(result.current.totalPages).toBe(3);
      expect(result.current.isLoading).toBe(false);
    });

    it('search, filters and page flow into the request', async () => {
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setSearch('Vali'));
      await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Vali', page: 0 })));

      act(() => result.current.setFilters('source', 'telegram'));
      await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ source: 'telegram' })));

      act(() => result.current.setFilters('startDate', undefined));
      await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ startDate: undefined })));

      act(() => result.current.setPage(1));
      await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
    });

    it('"Qarzdorlar" sends debtOnly=true without the month-to-date range; toggling again removes it', async () => {
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.toggleDebtOnly());
      expect(result.current.filters).toMatchObject({ debtOnly: 'true', startDate: undefined, endDate: undefined });
      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ debtOnly: 'true', startDate: undefined, endDate: undefined, page: 0 }),
        ),
      );
      act(() => result.current.toggleDebtOnly());
      await waitFor(() => expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ debtOnly: undefined })));
    });

    it('sorting is sent to the backend as sortBy + order', async () => {
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setSort('firstName'));
      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'firstName', order: 'asc' })),
      );
    });
  });

  describe('stats', () => {
    it('loads /patients/stats when authenticated', async () => {
      api.stats.mockResolvedValue({ total: 5, newThisMonth: 2, topSource: 'telegram' });
      const { result } = setup();
      await waitFor(() => expect(result.current.stats).toEqual({ total: 5, newThisMonth: 2, topSource: 'telegram' }));
    });

    it('does not load stats when logged out', async () => {
      loginAs(null);
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(api.stats).not.toHaveBeenCalled();
    });
  });

  describe('create / update', () => {
    it('handleSave without editing → create, invalidate ["patients"], toast, close dialog', async () => {
      api.create.mockResolvedValue(patient);
      const { result, invalidate } = setup();
      act(() => result.current.openCreate());
      expect(result.current.modalOpen).toBe(true);
      expect(result.current.editing).toBeNull();

      act(() => result.current.handleSave(form));

      await waitFor(() => expect(result.current.modalOpen).toBe(false));
      expect(api.create.mock.calls[0][0]).toEqual({ ...form, notes: '' });
      expect(api.update).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients'] });
      expect(toastMock.success).toHaveBeenCalledWith("Yangi bemor qo'shildi");
    });

    it('handleSave while editing → update(id, body), invalidate list + detail', async () => {
      api.update.mockResolvedValue(patient);
      const { result, invalidate } = setup();
      act(() => result.current.openEdit(patient));
      expect(result.current.editing).toEqual(patient);

      act(() => result.current.handleSave({ ...form, firstName: 'Vali' }));

      await waitFor(() => expect(result.current.modalOpen).toBe(false));
      expect(api.update).toHaveBeenCalledWith('p1', { ...form, firstName: 'Vali', assignedDoctorId: null });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients', 'p1'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['analytics'] });
      expect(toastMock.success).toHaveBeenCalledWith("Bemor ma'lumotlari yangilandi");
    });

    it('assignedDoctorId: selected id is sent on create/update; cleared select sends null (unassign) on update', async () => {
      api.create.mockResolvedValue(patient);
      api.update.mockResolvedValue(patient);
      const { result } = setup();
      act(() => result.current.openCreate());
      act(() => result.current.handleSave({ ...form, assignedDoctorId: 'd1' }));
      await waitFor(() => expect(api.create).toHaveBeenCalled());
      expect(api.create.mock.calls[0][0]).toMatchObject({ assignedDoctorId: 'd1' });

      act(() => result.current.openCreate());
      act(() => result.current.handleSave({ ...form, assignedDoctorId: '' }));
      await waitFor(() => expect(api.create).toHaveBeenCalledTimes(2));
      expect(api.create.mock.calls[1][0]).not.toHaveProperty('assignedDoctorId');

      act(() => result.current.openEdit(patient));
      act(() => result.current.handleSave({ ...form, assignedDoctorId: 'd2' }));
      await waitFor(() => expect(api.update).toHaveBeenCalledTimes(1));
      expect(api.update.mock.calls[0][1]).toMatchObject({ assignedDoctorId: 'd2' });

      act(() => result.current.openEdit(patient));
      act(() => result.current.handleSave({ ...form, assignedDoctorId: '' }));
      await waitFor(() => expect(api.update).toHaveBeenCalledTimes(2));
      expect(api.update.mock.calls[1][1]).toMatchObject({ assignedDoctorId: null });
    });

    it('reports isSaving while the request is in flight', async () => {
      let resolve!: (p: Patient) => void;
      api.create.mockReturnValue(new Promise((r) => (resolve = r)));
      const { result } = setup();
      act(() => result.current.handleSave(form));
      await waitFor(() => expect(result.current.isSaving).toBe(true));
      await act(async () => resolve(patient));
      await waitFor(() => expect(result.current.isSaving).toBe(false));
    });

    it('closes the dialog but does not invalidate or toast success on error', async () => {
      api.create.mockRejectedValue(new Error('400'));
      const { result, invalidate } = setup();
      act(() => result.current.openCreate());
      act(() => result.current.handleSave(form));
      await waitFor(() => expect(result.current.modalOpen).toBe(false));
      expect(invalidate).not.toHaveBeenCalled();
      expect(toastMock.success).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('handleDelete is a no-op without deleteId', () => {
      const { result } = setup();
      act(() => result.current.handleDelete());
      expect(api.remove).not.toHaveBeenCalled();
    });

    it('removes the selected patient, invalidates and clears deleteId', async () => {
      api.remove.mockResolvedValue({ id: 'p1' });
      const { result, invalidate } = setup();
      act(() => result.current.setDeleteId('p1'));
      expect(result.current.deleteId).toBe('p1');
      act(() => result.current.handleDelete());
      await waitFor(() => expect(result.current.deleteId).toBeNull());
      expect(api.remove.mock.calls[0][0]).toBe('p1');
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients'] });
      expect(toastMock.success).toHaveBeenCalledWith("Bemor o'chirildi");
    });
  });
  describe('delete conflict (409)', () => {
    it('shows the backend message when the patient has visits/payments and keeps the list', async () => {
      const msg = "Bemorda tashriflar yoki to'lovlar bor — o'chirib bo'lmaydi";
      api.remove.mockRejectedValue(new ApiError(409, msg));
      const { wrapper, queryClient } = createWrapper(createQueryClient());
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => usePatients(), { wrapper });
      act(() => result.current.setDeleteId('p1'));
      act(() => result.current.handleDelete());
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(msg, { description: undefined }));
      expect(toastMock.success).not.toHaveBeenCalledWith("Bemor o'chirildi");
      expect(invalidate).not.toHaveBeenCalled();
      expect(result.current.deleteId).toBeNull();
    });
  });
});
