import { act, renderHook, waitFor } from '@testing-library/react';
import { bookingsApi, doctorsApi, patientsApi, paymentsApi, visitsApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, paginated } from '@/test/utils';
import type { Doctor, Patient, Payment, Visit } from '@/shared/types';
import { usePatientProfile } from './usePatientProfile';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const pApi = vi.mocked(patientsApi);
const vApi = vi.mocked(visitsApi);
const payApi = vi.mocked(paymentsApi);

const patient: Patient = {
  id: 'p1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  age: 30,
  phone: '+998901112233',
  address: 'Toshkent',
  workplace: 'IT',
  source: 'telegram',
  notes: 'allergiya yo‘q',
  createdAt: '2026-06-01',
  toothChart: { 11: { toothNumber: 11, condition: 'filled', notes: 'eski' } },
};

const doctor = { id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' } as Doctor;

const visit = (id: string, price: number | string, doctorId = 'd1'): Visit =>
  ({ id, patientId: 'p1', doctorId, date: '2026-06-10', status: 'completed', price, diagnosis: '', treatment: '', notes: '' }) as Visit;

const pay = (id: string, amount: number | string, status: Payment['status'], visitId?: string): Payment =>
  ({ id, patientId: 'p1', amount, status, method: 'cash', type: 'INCOME', date: '2026-06-10', description: '', visitId }) as Payment;

function setup(id: string | null = 'p1') {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => usePatientProfile(id ?? undefined), { wrapper }), invalidate };
}

async function ready(result: { current: ReturnType<typeof usePatientProfile> }) {
  await waitFor(() => expect(result.current.patient).toBeTruthy());
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T09:00:00.000Z'));
  loginAs('admin');
  pApi.get.mockResolvedValue(patient);
  pApi.getComments.mockResolvedValue([]);
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated([doctor]));
});

afterEach(() => vi.useRealTimers());

describe('usePatientProfile', () => {
  describe('queries', () => {
    it('loads patient, visits, bookings, payments, doctors and comments for the id', async () => {
      const { result } = setup();
      await ready(result);
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(pApi.get).toHaveBeenCalledWith('p1');
      expect(vApi.list).toHaveBeenCalledWith({ patientId: 'p1', page: 0, limit: 100 });
      expect(bookingsApi.list).toHaveBeenCalledWith({ patientId: 'p1', page: 0, limit: 100 });
      expect(payApi.list).toHaveBeenCalledWith({ patientId: 'p1', page: 0, limit: 100 });
      expect(doctorsApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
      expect(pApi.getComments).toHaveBeenCalledWith('p1');
      expect(result.current.canManagePayments).toBe(true);
      await waitFor(() => expect(result.current.doctors).toEqual([doctor]));
    });

    it('fetches nothing without a patient id', async () => {
      setup(null);
      await Promise.resolve();
      expect(pApi.get).not.toHaveBeenCalled();
      expect(vApi.list).not.toHaveBeenCalled();
      expect(doctorsApi.list).not.toHaveBeenCalled();
    });

    it('non-admin roles do not request payments (backend ROLES_FINANCE)', async () => {
      loginAs('doctor');
      const { result } = setup();
      await ready(result);
      expect(payApi.list).not.toHaveBeenCalled();
      expect(result.current.canManagePayments).toBe(false);
      expect(result.current.patientPayments).toEqual([]);
    });

    it('loads the full history (every page) so >10 visits/payments give correct totals', async () => {
      const visits = Array.from({ length: 130 }, (_, i) => visit(`v${i}`, 1000));
      const payments = Array.from({ length: 120 }, (_, i) => pay(`x${i}`, 500, 'paid'));
      vApi.list.mockImplementation(async (p) => paginated(visits.slice(p!.page! * 100, p!.page! * 100 + 100), 130));
      payApi.list.mockImplementation(async (p) =>
        paginated(payments.slice(p!.page! * 100, p!.page! * 100 + 100), 120),
      );
      const { result } = setup();
      await waitFor(() => expect(result.current.patientVisits).toHaveLength(130));
      await waitFor(() => expect(result.current.patientPayments).toHaveLength(120));
      expect(result.current.totalDue).toBe(130_000);
      expect(result.current.totalPaid).toBe(60_000);
      expect(result.current.totalDebt).toBe(70_000);
      expect(vApi.list).toHaveBeenCalledWith({ patientId: 'p1', page: 1, limit: 100 });
      for (const [p] of vApi.list.mock.calls) expect(p!.limit).toBeLessThanOrEqual(100);
    });

    it('doctor role gets the doctor list (GET /doctors allowed) and the visit form pre-selects their own doctorId', async () => {
      loginAs('doctor', { doctorId: 'd1' });
      const { result } = setup();
      await waitFor(() => expect(result.current.doctors).toEqual([doctor]));
      expect(result.current.visitForm.doctorId).toBe('d1');
      expect(result.current.canAddVisit).toBe(true);
    });

    it('receptionist cannot add visits (backend visits.create = admin+doctor)', async () => {
      loginAs('receptionist');
      const { result } = setup();
      await ready(result);
      expect(result.current.canAddVisit).toBe(false);
      expect(result.current.canEditPatient).toBe(true);
    });
  });

  describe('balance', () => {
    it('totalDue = Σ visit prices, totalPaid = Σ paid+partial, totalDebt = max(0, due − paid)', async () => {
      vApi.list.mockResolvedValue(paginated([visit('v1', 300000), visit('v2', '200000')]));
      payApi.list.mockResolvedValue(
        paginated([pay('a', 100000, 'paid'), pay('b', '50000', 'partial'), pay('c', 999999, 'unpaid')]),
      );
      const { result } = setup();
      await waitFor(() => expect(result.current.totalPaid).toBe(150000));
      expect(result.current.totalDue).toBe(500000);
      expect(result.current.totalDebt).toBe(350000);
    });

    it('prefers the backend balance for debt (negative balance = debt)', async () => {
      pApi.get.mockResolvedValue({ ...patient, balance: -420_000 });
      vApi.list.mockResolvedValue(paginated([visit('v1', 100)]));
      const { result } = setup();
      await waitFor(() => expect(result.current.totalDebt).toBe(420_000));
    });

    it('positive backend balance (prepaid) → no debt, also for roles without payment access', async () => {
      loginAs('doctor');
      pApi.get.mockResolvedValue({ ...patient, balance: 50_000 });
      vApi.list.mockResolvedValue(paginated([visit('v1', 100_000)]));
      const { result } = setup();
      await waitFor(() => expect(result.current.patientVisits).toHaveLength(1));
      expect(result.current.totalDebt).toBe(0);
    });

    it('overpayment never yields negative debt; bad numbers count as 0', async () => {
      vApi.list.mockResolvedValue(paginated([visit('v1', 100), visit('v2', 'abc')]));
      payApi.list.mockResolvedValue(paginated([pay('a', 500, 'paid'), pay('b', 'x', 'paid')]));
      const { result } = setup();
      await waitFor(() => expect(result.current.totalPaid).toBe(500));
      expect(result.current.totalDue).toBe(100);
      expect(result.current.totalDebt).toBe(0);
    });

    it('getVisitBalance subtracts paid/partial payments linked to that visit', async () => {
      payApi.list.mockResolvedValue(
        paginated([
          pay('a', 100, 'paid', 'v1'),
          pay('b', 50, 'partial', 'v1'),
          pay('c', 70, 'unpaid', 'v1'),
          pay('d', 30, 'paid', 'v2'),
        ]),
      );
      const { result } = setup();
      await waitFor(() => expect(result.current.patientPayments).toHaveLength(4));
      expect(result.current.getVisitBalance('v1', 400)).toBe(250);
      expect(result.current.getVisitBalance('v2', 20)).toBe(0);
      expect(result.current.getVisitBalance('v3', 90)).toBe(90);
    });

    it('openPaymentForVisit pre-fills the remaining balance and a description with the doctor name', async () => {
      payApi.list.mockResolvedValue(paginated([pay('a', 100, 'paid', 'v1')]));
      const { result } = setup();
      await waitFor(() => expect(result.current.patientPayments).toHaveLength(1));
      await waitFor(() => expect(result.current.doctors).toHaveLength(1));
      act(() => result.current.openPaymentForVisit(visit('v1', 400)));
      expect(result.current.paymentModal).toBe(true);
      expect(result.current.payForm).toEqual({
        amount: '300',
        method: 'cash',
        status: 'paid',
        description: "2026-06-10 - Aziz Karimov uchun to'lov",
        visitId: 'v1',
      });

      act(() => result.current.openPaymentForVisit(visit('v9', 50, 'unknown')));
      expect(result.current.payForm.description).toBe("2026-06-10 - Tashrif uchun to'lov");
    });
  });

  describe('edit patient', () => {
    it('openEdit copies the patient into the edit form', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.openEdit());
      expect(result.current.editOpen).toBe(true);
      expect(result.current.editForm).toMatchObject({
        firstName: 'Ali',
        lastName: 'Valiyev',
        age: '30',
        phone: '+998901112233',
        address: 'Toshkent',
        workplace: 'IT',
        source: 'telegram',
        notes: 'allergiya yo‘q',
      });
    });

    it('edit form uses assignedDoctorId from GET /patients/:id; clearing it sends null (unassign)', async () => {
      pApi.get.mockResolvedValue({ ...patient, assignedDoctorId: 'd1', assignedDoctor: { firstName: 'Aziz', lastName: 'Karimov' } });
      pApi.update.mockResolvedValue(patient);
      const { result } = setup();
      await ready(result);
      act(() => result.current.openEdit());
      expect(result.current.editForm.assignedDoctorId).toBe('d1');

      act(() => result.current.handleEditSave());
      await waitFor(() => expect(pApi.update).toHaveBeenCalledTimes(1));
      expect(pApi.update.mock.calls[0][1]).toMatchObject({ assignedDoctorId: 'd1' });

      act(() => result.current.openEdit());
      act(() => result.current.setEditForm({ ...result.current.editForm, assignedDoctorId: '' }));
      act(() => result.current.handleEditSave());
      await waitFor(() => expect(pApi.update).toHaveBeenCalledTimes(2));
      expect(pApi.update.mock.calls[1][1]).toMatchObject({ assignedDoctorId: null });
    });

    it('handleEditSave validates required fields', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.setEditForm({ ...result.current.editForm, firstName: '', phone: '' }));
      act(() => result.current.handleEditSave());
      expect(toastMock.error).toHaveBeenCalledWith("Majburiy maydonlarni to'ldiring");
      expect(pApi.update).not.toHaveBeenCalled();
    });

    it('handleEditSave PATCHes with numeric age, invalidates, toasts and closes', async () => {
      pApi.update.mockResolvedValue(patient);
      const { result, invalidate } = setup();
      await ready(result);
      act(() => result.current.openEdit());
      act(() => result.current.setEditForm({ ...result.current.editForm, age: '31' }));
      act(() => result.current.handleEditSave());
      await waitFor(() => expect(result.current.editOpen).toBe(false));
      expect(pApi.update).toHaveBeenCalledWith('p1', expect.objectContaining({ firstName: 'Ali', age: 31 }));
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients', 'p1'] });
      expect(toastMock.success).toHaveBeenCalledWith("Bemor ma'lumotlari yangilandi");
    });

    it('handlers are no-ops before the patient is loaded', () => {
      pApi.get.mockReturnValue(new Promise(() => {}));
      const { result } = setup();
      act(() => {
        result.current.handleEditSave();
        result.current.openEdit();
        result.current.openToothEdit(11);
        result.current.handleToothSave();
        result.current.handleVisitSave();
        result.current.handlePaymentSave();
      });
      expect(result.current.editOpen).toBe(false);
      expect(result.current.toothModal).toBe(false);
      expect(pApi.update).not.toHaveBeenCalled();
      expect(vApi.create).not.toHaveBeenCalled();
      expect(payApi.create).not.toHaveBeenCalled();
    });
  });

  describe('tooth chart', () => {
    it('openToothEdit loads an existing record', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.openToothEdit(11));
      expect(result.current.toothModal).toBe(true);
      expect(result.current.selectedTooth).toBe(11);
      expect(result.current.toothForm).toEqual({ condition: 'filled', notes: 'eski' });
    });

    it('openToothEdit defaults unknown teeth to healthy', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.openToothEdit(36));
      expect(result.current.toothForm).toEqual({ condition: 'healthy', notes: '' });
    });

    it('handleToothSave merges the tooth into the chart and PATCHes it', async () => {
      pApi.update.mockResolvedValue(patient);
      const { result } = setup();
      await ready(result);
      act(() => result.current.openToothEdit(36));
      act(() => result.current.setToothForm({ condition: 'cavity', notes: 'chuqur' }));
      act(() => result.current.handleToothSave());
      await waitFor(() => expect(result.current.toothModal).toBe(false));
      expect(pApi.update).toHaveBeenCalledWith('p1', {
        toothChart: {
          11: { toothNumber: 11, condition: 'filled', notes: 'eski' },
          36: { toothNumber: 36, condition: 'cavity', notes: 'chuqur', date: '2026-06-17' },
        },
      });
      expect(toastMock.success).toHaveBeenCalledWith("36-tish ma'lumoti yangilandi");
    });
  });

  describe('visits', () => {
    it('requires a doctor', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.handleVisitSave());
      expect(toastMock.error).toHaveBeenCalledWith('Shifokorni tanlang');
      expect(vApi.create).not.toHaveBeenCalled();
    });

    it('creates a visit with numeric price; no payment unless "pay now"', async () => {
      vApi.create.mockResolvedValue(visit('v-new', 250000));
      const { result, invalidate } = setup();
      await ready(result);
      act(() => result.current.setVisitModal(true));
      act(() =>
        result.current.setVisitForm({ ...result.current.visitForm, doctorId: 'd1', price: '250000', diagnosis: 'Karies' }),
      );
      act(() => result.current.handleVisitSave());
      await waitFor(() => expect(result.current.visitModal).toBe(false));
      expect(vApi.create.mock.calls[0][0]).toEqual({
        patientId: 'p1',
        doctorId: 'd1',
        date: '2026-06-17',
        status: 'completed',
        diagnosis: 'Karies',
        treatment: '',
        notes: '',
        price: 250000,
      });
      expect(payApi.create).not.toHaveBeenCalled();
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['visits'] });
      expect(toastMock.success).toHaveBeenCalledWith('Tashrif muvaffaqiyatli saqlandi');
      expect(result.current.visitForm.doctorId).toBe('');
    });

    it('with "pay now" also creates a linked paid INCOME payment', async () => {
      vApi.create.mockResolvedValue(visit('v-new', 250000));
      payApi.create.mockResolvedValue(pay('np', 100000, 'paid', 'v-new'));
      const { result, invalidate } = setup();
      await ready(result);
      act(() =>
        result.current.setVisitForm({
          ...result.current.visitForm,
          doctorId: 'd1',
          price: '',
          shouldPayNow: true,
          payAmount: '100000',
          payMethod: 'card',
        }),
      );
      act(() => result.current.handleVisitSave());
      await waitFor(() => expect(payApi.create).toHaveBeenCalled());
      expect(vApi.create.mock.calls[0][0]).toMatchObject({ price: 0 });
      expect(payApi.create.mock.calls[0][0]).toEqual({
        patientId: 'p1',
        amount: 100000,
        method: 'card',
        status: 'paid',
        type: 'INCOME',
        date: '2026-06-17',
        description: "2026-06-17 - Tashrif uchun to'lov",
        visitId: 'v-new',
      });
      await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payments'] }));
    });

    it('visit, payment and tooth dates use the Tashkent date right after local midnight', async () => {
      vi.setSystemTime(new Date('2026-06-16T19:30:00.000Z')); // 00:30 on 06-17 in Tashkent; UTC is still 06-16
      vApi.create.mockResolvedValue(visit('v-new', 1));
      payApi.create.mockResolvedValue(pay('np', 1, 'paid'));
      pApi.update.mockResolvedValue(patient);
      const { result } = setup();
      await ready(result);

      act(() =>
        result.current.setVisitForm({
          ...result.current.visitForm,
          doctorId: 'd1',
          shouldPayNow: true,
          payAmount: '10',
        }),
      );
      act(() => result.current.handleVisitSave());
      await waitFor(() => expect(payApi.create).toHaveBeenCalled());
      expect(vApi.create.mock.calls[0][0]).toMatchObject({ date: '2026-06-17' });
      expect(payApi.create.mock.calls[0][0]).toMatchObject({ date: '2026-06-17' });

      act(() => result.current.setPayForm({ amount: '5', method: 'cash', status: 'paid', description: 'x', visitId: '' }));
      act(() => result.current.handlePaymentSave());
      await waitFor(() => expect(payApi.create).toHaveBeenCalledTimes(2));
      expect(payApi.create.mock.calls[1][0]).toMatchObject({ date: '2026-06-17' });

      act(() => result.current.openToothEdit(21));
      act(() => result.current.handleToothSave());
      await waitFor(() => expect(pApi.update).toHaveBeenCalled());
      expect(pApi.update.mock.calls[0][1].toothChart![21]).toMatchObject({ date: '2026-06-17' });
    });
  });

  describe('payments', () => {
    it('validates amount and description', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.handlePaymentSave());
      expect(toastMock.error).toHaveBeenCalledWith("Majburiy maydonlarni to'ldiring");
      expect(payApi.create).not.toHaveBeenCalled();
    });

    it('creates a payment (empty visitId → undefined), resets and closes', async () => {
      payApi.create.mockResolvedValue(pay('np', 5000, 'partial'));
      const { result, invalidate } = setup();
      await ready(result);
      act(() => result.current.setPaymentModal(true));
      act(() =>
        result.current.setPayForm({ amount: '5000', method: 'transfer', status: 'partial', description: 'Avans', visitId: '' }),
      );
      act(() => result.current.handlePaymentSave());
      await waitFor(() => expect(result.current.paymentModal).toBe(false));
      expect(payApi.create.mock.calls[0][0]).toEqual({
        patientId: 'p1',
        amount: 5000,
        method: 'transfer',
        status: 'partial',
        type: 'INCOME',
        date: '2026-06-17',
        description: 'Avans',
        visitId: undefined,
      });
      expect(result.current.payForm).toEqual({ amount: '', method: 'cash', status: 'paid', description: '', visitId: '' });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payments'] });
      // balance/debt is served by GET /patients/:id → refresh it too
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients'] });
      expect(toastMock.success).toHaveBeenCalledWith("To'lov qayd etildi");
    });
  });

  describe('comments', () => {
    it('ignores blank comments', async () => {
      const { result } = setup();
      await ready(result);
      act(() => result.current.handleAddComment('   '));
      expect(pApi.addComment).not.toHaveBeenCalled();
    });

    it('posts the comment and refreshes the comment list', async () => {
      pApi.addComment.mockResolvedValue({ id: 'c1' } as never);
      const { result, invalidate } = setup();
      await ready(result);
      act(() => result.current.handleAddComment('Nazorat 2 haftadan keyin'));
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Izoh qo'shildi"));
      expect(pApi.addComment).toHaveBeenCalledWith('p1', { content: 'Nazorat 2 haftadan keyin' });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['patients', 'p1', 'comments'] });
    });

    it('exposes loaded comments', async () => {
      pApi.getComments.mockResolvedValue([{ id: 'c1', content: 'x' }] as never);
      const { result } = setup();
      await waitFor(() => expect(result.current.comments).toEqual([{ id: 'c1', content: 'x' }]));
    });
  });
});
