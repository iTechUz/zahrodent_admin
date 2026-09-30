import { act, renderHook, waitFor } from '@testing-library/react';
import { doctorsApi, patientsApi, visitsApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import { defaultDoctorSchedule } from '@/shared/lib/doctor-schedule';
import type { DoctorFormValues } from '@/shared/lib/validation';
import type { Doctor, Visit } from '@/shared/types';
import { useDoctor, useDoctors } from './useDoctors';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const doctors = vi.mocked(doctorsApi);
const visits = vi.mocked(visitsApi);
const patients = vi.mocked(patientsApi);

const doctor: Doctor = {
  id: 'd1',
  firstName: 'Aziz',
  lastName: 'Karimov',
  specialty: 'Terapevt',
  phone: '+998901112233',
};

const visit: Visit = {
  id: 'v1',
  patientId: 'p1',
  doctorId: 'd1',
  date: '2026-06-10',
  status: 'in-progress',
  price: 100000,
  diagnosis: '',
  treatment: '',
  notes: '',
};

const baseForm: DoctorFormValues = {
  firstName: 'Aziz',
  lastName: 'Karimov',
  specialty: 'Terapevt',
  phone: '+998901112233',
  schedule: defaultDoctorSchedule(),
};

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const hook = renderHook(() => useDoctors(), { wrapper });
  return { ...hook, invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T09:00:00.000Z'));
  loginAs('admin');
});

afterEach(() => vi.useRealTimers());

describe('useDoctors', () => {
  describe('queries', () => {
    it('lists doctors with page/limit/search and exposes pagination', async () => {
      doctors.list.mockResolvedValue(paginated([doctor], 11));
      const { result } = setup();
      await waitFor(() => expect(result.current.doctors).toEqual([doctor]));
      expect(doctors.list).toHaveBeenCalledWith({ page: 0, limit: 10, search: '' });
      expect(result.current.totalDoctors).toBe(11);
      expect(result.current.totalPages).toBe(2);
    });

    it('specialty filter is sent to the backend', async () => {
      const { result } = setup();
      act(() => result.current.setFilters('specialty', 'Ortodont'));
      await waitFor(() =>
        expect(doctors.list).toHaveBeenLastCalledWith({ page: 0, limit: 10, search: '', specialty: 'Ortodont' }),
      );
    });

    it('loads the patient lookup (every page, max 100 per request); no unused visits list', async () => {
      patients.list.mockResolvedValue(paginated([{ id: 'p1' }]) as never);
      const { result } = setup();
      await waitFor(() => expect(result.current.patients).toEqual([{ id: 'p1' }]));
      expect(patients.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
      expect(visits.list).not.toHaveBeenCalled();
    });

    it('admin gets stats and efficiency', async () => {
      doctors.stats.mockResolvedValue({ total: 3, activeToday: 1, totalVisits: 9 });
      doctors.efficiency.mockResolvedValue([{ id: 'd1' }] as never);
      const { result } = setup();
      await waitFor(() => expect(result.current.efficiency).toEqual([{ id: 'd1' }]));
      expect(result.current.stats).toEqual({ total: 3, activeToday: 1, totalVisits: 9 });
    });

    it('non-admin does not request /doctors/efficiency or /doctors/stats (backend: admin only)', async () => {
      loginAs('receptionist');
      const { result } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(doctors.efficiency).not.toHaveBeenCalled();
      expect(doctors.stats).not.toHaveBeenCalled();
      expect(result.current.efficiency).toEqual([]);
    });

    it('nothing is fetched for lookups when logged out', async () => {
      loginAs(null);
      setup();
      await Promise.resolve();
      expect(doctors.stats).not.toHaveBeenCalled();
      expect(patients.list).not.toHaveBeenCalled();
      expect(visits.list).not.toHaveBeenCalled();
    });
  });

  describe('handleSaveDoctor', () => {
    it('create: sends form fields + schedule, parses daysOffText into a trimmed array, drops daysOffText', async () => {
      doctors.create.mockResolvedValue(doctor);
      const { result, invalidate } = setup();
      act(() => result.current.openCreate());

      act(() =>
        result.current.handleSaveDoctor({
          ...baseForm,
          password: 'secret1',
          daysOffText: ' 2026-01-01, ,2026-03-21 ',
        }),
      );

      await waitFor(() => expect(result.current.modalOpen).toBe(false));
      expect(doctors.update).not.toHaveBeenCalled();
      expect(doctors.create).toHaveBeenCalledTimes(1);
      const body = doctors.create.mock.calls[0][0];
      expect(body).toEqual({
        firstName: 'Aziz',
        lastName: 'Karimov',
        specialty: 'Terapevt',
        phone: '+998901112233',
        password: 'secret1',
        schedule: baseForm.schedule,
        daysOff: ['2026-01-01', '2026-03-21'],
      });
      expect(body).not.toHaveProperty('daysOffText');
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['doctors'] });
      expect(toastMock.success).toHaveBeenCalledWith('Shifokor saqlandi');
    });

    it('omits daysOff when daysOffText is empty', async () => {
      doctors.create.mockResolvedValue(doctor);
      const { result } = setup();
      act(() => result.current.handleSaveDoctor({ ...baseForm, daysOffText: '' }));
      await waitFor(() => expect(doctors.create).toHaveBeenCalled());
      expect(doctors.create.mock.calls[0][0]).not.toHaveProperty('daysOff');
    });

    it('edit: PATCHes the editing doctor', async () => {
      doctors.update.mockResolvedValue(doctor);
      const { result } = setup();
      act(() => result.current.openEdit(doctor));
      expect(result.current.editing).toEqual(doctor);
      act(() => result.current.handleSaveDoctor({ ...baseForm, specialty: 'Xirurg' }));
      await waitFor(() => expect(doctors.update).toHaveBeenCalled());
      expect(doctors.update.mock.calls[0][0]).toBe('d1');
      expect(doctors.update.mock.calls[0][1]).toMatchObject({ specialty: 'Xirurg' });
      expect(doctors.create).not.toHaveBeenCalled();
    });

    it('an empty password is omitted on create and on edit (backend MinLength(6) when present)', async () => {
      doctors.create.mockResolvedValue(doctor);
      doctors.update.mockResolvedValue(doctor);
      const { result } = setup();
      act(() => result.current.openCreate());
      act(() => result.current.handleSaveDoctor({ ...baseForm, password: '' }));
      await waitFor(() => expect(doctors.create).toHaveBeenCalled());
      expect(doctors.create.mock.calls[0][0]).not.toHaveProperty('password');

      act(() => result.current.openEdit(doctor));
      act(() => result.current.handleSaveDoctor({ ...baseForm, password: '   ' }));
      await waitFor(() => expect(doctors.update).toHaveBeenCalled());
      expect(doctors.update.mock.calls[0][1]).not.toHaveProperty('password');
    });

    it('a non-empty password is still sent on edit (password change)', async () => {
      doctors.update.mockResolvedValue(doctor);
      const { result } = setup();
      act(() => result.current.openEdit(doctor));
      act(() => result.current.handleSaveDoctor({ ...baseForm, password: 'newpass1' }));
      await waitFor(() => expect(doctors.update).toHaveBeenCalled());
      expect(doctors.update.mock.calls[0][1]).toMatchObject({ password: 'newpass1' });
    });
  });

  describe('handleDeleteDoctor', () => {
    it('does nothing without deleteId', () => {
      const { result } = setup();
      act(() => result.current.handleDeleteDoctor());
      expect(doctors.remove).not.toHaveBeenCalled();
    });

    it('removes, invalidates and clears deleteId', async () => {
      doctors.remove.mockResolvedValue({ id: 'd1' });
      const { result, invalidate } = setup();
      act(() => result.current.setDeleteId('d1'));
      act(() => result.current.handleDeleteDoctor());
      await waitFor(() => expect(result.current.deleteId).toBeNull());
      expect(doctors.remove.mock.calls[0][0]).toBe('d1');
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['doctors'] });
      expect(toastMock.success).toHaveBeenCalledWith("Shifokor o'chirildi");
    });
  });

  describe('visits', () => {
    it('openVisitForm selects the doctor and opens the modal', () => {
      const { result } = setup();
      act(() => result.current.openVisitForm(doctor, visit));
      expect(result.current.selectedDoctor).toEqual(doctor);
      expect(result.current.editingVisit).toEqual(visit);
      expect(result.current.visitModal).toBe(true);

      act(() => result.current.openVisitForm(doctor));
      expect(result.current.editingVisit).toBeNull();
    });

    it('handleSaveVisit without a selected doctor shows an error', () => {
      const { result } = setup();
      act(() => result.current.handleSaveVisit({ patientId: 'p1', status: 'completed' }));
      expect(toastMock.error).toHaveBeenCalledWith('Iltimos, shifokorni tanlang');
      expect(visits.create).not.toHaveBeenCalled();
    });

    it('create: POST /visits with the selected doctor, today and "" defaults', async () => {
      visits.create.mockResolvedValue(visit);
      const { result, invalidate } = setup();
      act(() => result.current.openVisitForm(doctor));
      act(() => result.current.handleSaveVisit({ patientId: 'p1', status: 'completed', diagnosis: 'Karies' }));
      await waitFor(() => expect(result.current.visitModal).toBe(false));
      expect(visits.create.mock.calls[0][0]).toEqual({
        patientId: 'p1',
        doctorId: 'd1',
        date: '2026-06-17',
        status: 'completed',
        diagnosis: 'Karies',
        treatment: '',
        notes: '',
      });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['visits'] });
      expect(toastMock.success).toHaveBeenCalledWith('Tashrif saqlandi');
    });

    it('edit: PATCH /visits/:id with the form data', async () => {
      visits.update.mockResolvedValue(visit);
      const { result } = setup();
      act(() => result.current.openVisitForm(doctor, visit));
      act(() => result.current.handleSaveVisit({ patientId: 'p1', status: 'completed' }));
      await waitFor(() => expect(visits.update).toHaveBeenCalled());
      expect(visits.update).toHaveBeenCalledWith('v1', { patientId: 'p1', status: 'completed' });
      expect(visits.create).not.toHaveBeenCalled();
    });

    it('visit date is the Tashkent date right after local midnight (not UTC yesterday)', async () => {
      vi.setSystemTime(new Date('2026-06-16T19:10:00.000Z')); // 00:10 on 06-17 in Tashkent
      visits.create.mockResolvedValue(visit);
      const { result } = setup();
      act(() => result.current.openVisitForm(doctor));
      act(() => result.current.handleSaveVisit({ patientId: 'p1', status: 'completed' }));
      await waitFor(() => expect(visits.create).toHaveBeenCalled());
      expect(visits.create.mock.calls[0][0]).toMatchObject({ date: '2026-06-17' });
    });
  });
});

describe('useDoctor', () => {
  it('fetches /doctors/:id', async () => {
    loginAs('admin');
    doctors.get.mockResolvedValue(doctor);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDoctor('d1'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(doctor));
    expect(doctors.get).toHaveBeenCalledWith('d1');
  });

  it('is disabled for an empty id or when logged out', async () => {
    const { wrapper } = createWrapper();
    loginAs('admin');
    renderHook(() => useDoctor(''), { wrapper }).unmount();
    loginAs(null);
    renderHook(() => useDoctor('d1'), { wrapper });
    await Promise.resolve();
    expect(doctors.get).not.toHaveBeenCalled();
  });
});
