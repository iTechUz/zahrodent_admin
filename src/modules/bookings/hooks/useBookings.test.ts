import { act, renderHook, waitFor } from '@testing-library/react';
import { bookingsApi, doctorsApi, patientsApi, servicesApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import { ApiError } from '@/lib/api/client';
import type { BookingFormValues } from '@/shared/lib/validation';
import type { Booking } from '@/shared/types';
import { useBookings } from './useBookings';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const bookings = vi.mocked(bookingsApi);

const booking: Booking = {
  id: 'b1',
  patientId: 'p1',
  doctorId: 'd1',
  date: '2026-06-17',
  time: '10:00',
  source: 'phone',
  status: 'pending',
  createdAt: '2026-06-01',
};

const form: BookingFormValues = {
  patientId: 'p1',
  doctorId: 'd1',
  serviceId: '',
  date: '2026-06-17',
  time: '10:00',
  source: 'phone',
  status: 'pending',
  notes: '',
};

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => useBookings(), { wrapper }), invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 17, 12, 0));
  loginAs('receptionist');
});

afterEach(() => vi.useRealTimers());

describe('useBookings', () => {
  describe('queries', () => {
    it('lists bookings with MTD range and "all" status/source filters', async () => {
      bookings.list.mockResolvedValue(paginated([booking], 1));
      const { result } = setup();
      await waitFor(() => expect(result.current.bookings).toEqual([booking]));
      expect(bookings.list).toHaveBeenCalledWith({
        page: 0,
        limit: 10,
        search: '',
        status: 'all',
        source: 'all',
        dateRange: 'month',
        startDate: '2026-06-01',
        endDate: '',
      });
      expect(result.current.totalBookings).toBe(1);
      expect(result.current.totalPages).toBe(1);
    });

    it('status filter change refetches from page 0', async () => {
      const { result } = setup();
      act(() => result.current.setPage(2));
      act(() => result.current.setFilters('status', 'confirmed'));
      expect(result.current.page).toBe(0);
      await waitFor(() =>
        expect(bookings.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'confirmed', page: 0 })),
      );
    });

    it('loads every page of patients, doctors and services for lookups (max 100 per request)', async () => {
      vi.mocked(patientsApi.list).mockResolvedValue(paginated([{ id: 'p1' }]) as never);
      vi.mocked(doctorsApi.list).mockResolvedValue(paginated([{ id: 'd1' }]) as never);
      vi.mocked(servicesApi.list).mockResolvedValue(paginated([{ id: 's1' }]) as never);
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(patientsApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
      expect(doctorsApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
      expect(servicesApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
      expect(result.current.patients).toEqual([{ id: 'p1' }]);
      expect(result.current.doctors).toEqual([{ id: 'd1' }]);
      expect(result.current.services).toEqual([{ id: 's1' }]);
    });

    it('isLoading stays true until every lookup settles', async () => {
      let release!: () => void;
      vi.mocked(servicesApi.list).mockReturnValue(
        new Promise((r) => (release = () => r(paginated([]) as never))) as never,
      );
      const { result } = setup();
      await waitFor(() => expect(bookings.list).toHaveBeenCalled());
      expect(result.current.isLoading).toBe(true);
      await act(async () => release());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('loads stats', async () => {
      bookings.stats.mockResolvedValue({ today: 4, pending: 2, completedToday: 1 });
      const { result } = setup();
      await waitFor(() => expect(result.current.stats).toEqual({ today: 4, pending: 2, completedToday: 1 }));
    });

    it('doctor role loads the doctor lookup (GET /doctors is allowed for doctors)', async () => {
      loginAs('doctor', { doctorId: 'd1' });
      vi.mocked(doctorsApi.list).mockResolvedValue(paginated([{ id: 'd1', firstName: 'Aziz', lastName: 'K' }]) as never);
      const { result } = setup();
      await waitFor(() => expect(result.current.doctors).toHaveLength(1));
      expect(doctorsApi.list).toHaveBeenCalled();
    });

    it('lookup keys are distinct from list keys (no cache sharing with other limits)', async () => {
      const { wrapper, queryClient } = createWrapper();
      renderHook(() => useBookings(), { wrapper });
      await waitFor(() => expect(servicesApi.list).toHaveBeenCalled());
      const keys = queryClient.getQueryCache().getAll().map((q) => q.queryKey);
      expect(keys).toEqual(
        expect.arrayContaining([
          ['patients', 'lookup', {}],
          ['doctors', 'lookup', {}],
          ['services', 'lookup', {}],
          ['bookings', 'stats'],
        ]),
      );
      expect(keys).not.toContainEqual(['patients']);
    });
  });

  describe('mutations', () => {
    it('create → POST, invalidate ["bookings"], toast, close dialog', async () => {
      bookings.create.mockResolvedValue(booking);
      const { result, invalidate } = setup();
      act(() => result.current.openCreate());
      act(() => result.current.handleSave(form));
      await waitFor(() => expect(result.current.modalOpen).toBe(false));
      expect(bookings.create.mock.calls[0][0]).toEqual(form);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['bookings'] });
      expect(toastMock.success).toHaveBeenCalledWith('Yangi qabul yaratildi');
    });

    it('edit → PATCH /bookings/:id and "updated" toast', async () => {
      bookings.update.mockResolvedValue(booking);
      const { result, invalidate } = setup();
      act(() => result.current.openEdit(booking));
      act(() => result.current.handleSave({ ...form, time: '11:00' }));
      await waitFor(() => expect(result.current.modalOpen).toBe(false));
      expect(bookings.update).toHaveBeenCalledWith('b1', { ...form, time: '11:00' });
      expect(bookings.create).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['bookings'] });
      expect(toastMock.success).toHaveBeenCalledWith('Qabul muvaffaqiyatli yangilandi');
    });

    it('a rejected create (conflict / past date / outside schedule) keeps the form open and shows no success toast', async () => {
      bookings.create.mockRejectedValue(new ApiError(409, "Shifokor bu vaqtda band"));
      const { result, invalidate } = setup();
      act(() => result.current.openCreate());
      act(() => result.current.handleSave(form));
      await waitFor(() => expect(bookings.create).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 0));
      expect(result.current.modalOpen).toBe(true);
      expect(invalidate).not.toHaveBeenCalled();
      expect(toastMock.success).not.toHaveBeenCalled();
    });

    it('a rejected edit keeps the form open', async () => {
      bookings.update.mockRejectedValue(new ApiError(400, "Shifokorning dam olish kuni"));
      const { result } = setup();
      act(() => result.current.openEdit(booking));
      act(() => result.current.handleSave({ ...form, date: '2026-06-20' }));
      await waitFor(() => expect(bookings.update).toHaveBeenCalled());
      await new Promise((r) => setTimeout(r, 0));
      expect(result.current.modalOpen).toBe(true);
    });

    it('handleStatusChange PATCHes only the status and toasts the Uzbek label', async () => {
      bookings.update.mockResolvedValue({ ...booking, status: 'arrived' });
      const { result } = setup();
      act(() => result.current.handleStatusChange('b1', 'arrived'));
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Holat "Keldi" ga o\'zgartirildi'));
      expect(bookings.update).toHaveBeenCalledWith('b1', { status: 'arrived' });
    });

    it('handleDelete removes the selected booking', async () => {
      bookings.remove.mockResolvedValue({ id: 'b1' });
      const { result, invalidate } = setup();
      act(() => result.current.handleDelete());
      expect(bookings.remove).not.toHaveBeenCalled();
      act(() => result.current.setDeleteId('b1'));
      act(() => result.current.handleDelete());
      await waitFor(() => expect(result.current.deleteId).toBeNull());
      expect(bookings.remove.mock.calls[0][0]).toBe('b1');
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['bookings'] });
      expect(toastMock.success).toHaveBeenCalledWith("Qabul o'chirildi");
    });

    it('setViewBooking stores the booking being viewed', () => {
      const { result } = setup();
      act(() => result.current.setViewBooking(booking));
      expect(result.current.viewBooking).toEqual(booking);
    });
  });
});
