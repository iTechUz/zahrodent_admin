import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { usePatientProfile } from './usePatientProfile';
import { useStore } from '@/store/useStore';
import { mockPatients, mockPayments, mockVisits } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const patient = (id: string) => useStore.getState().patients.find((p) => p.id === id)!;

describe('usePatientProfile', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('derived data', () => {
    it('selects the patient and their records', () => {
      const { result } = renderHook(() => usePatientProfile('p2'));
      expect(result.current.patient).toBe(mockPatients[1]);
      expect(result.current.patientVisits.map((v) => v.id)).toEqual(['v2']);
      expect(result.current.patientBookings.map((b) => b.id)).toEqual(['b2']);
      expect(result.current.patientPayments.map((p) => p.id)).toEqual(['pay2']);
      expect(result.current.totalPaid).toBe(0);
      expect(result.current.totalDebt).toBe(200000); // partial counts as debt
    });

    it('sums paid amounts', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      expect(result.current.totalPaid).toBe(150000);
      expect(result.current.totalDebt).toBe(0);
    });

    it.each([undefined, 'nope'])('unknown patient id %p → undefined patient and empty lists', (id) => {
      const { result } = renderHook(() => usePatientProfile(id));
      expect(result.current.patient).toBeUndefined();
      expect(result.current.patientVisits).toEqual([]);
      expect(result.current.patientPayments).toEqual([]);
      expect(result.current.totalPaid + result.current.totalDebt).toBe(0);
    });

    it('all handlers are no-ops for a missing patient', () => {
      const { result } = renderHook(() => usePatientProfile('nope'));
      act(() => {
        result.current.openEdit();
        result.current.openToothEdit(11);
      });
      act(() => {
        result.current.handleEditSave();
        result.current.handleToothSave();
        result.current.handleVisitSave();
        result.current.handlePaymentSave();
      });
      expect(result.current.editOpen).toBe(false);
      expect(result.current.toothModal).toBe(false);
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(useStore.getState().visits).toHaveLength(mockVisits.length);
    });
  });

  describe('edit patient', () => {
    it('openEdit fills the form from the patient (age as string, optional → "")', () => {
      const { result } = renderHook(() => usePatientProfile('p3'));
      act(() => result.current.openEdit());
      expect(result.current.editOpen).toBe(true);
      expect(result.current.editForm).toEqual({
        firstName: 'Dilnoza', lastName: 'Yusupova', age: '22', phone: '+998 93 345 6789',
        source: 'website', notes: 'Ortodontik davolash', allergies: '', bloodType: 'O+',
      });
    });

    it('handleEditSave requires first name and phone', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.openEdit());
      act(() => result.current.setEditForm({ ...result.current.editForm, phone: '' }));
      act(() => result.current.handleEditSave());
      expect(toast.error).toHaveBeenCalledWith("Majburiy maydonlarni to'ldiring");
      expect(result.current.editOpen).toBe(true);
      expect(patient('p1')).toBe(mockPatients[0]);
    });

    it('handleEditSave saves and converts age to a number', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.openEdit());
      act(() => result.current.setEditForm({ ...result.current.editForm, firstName: 'Oysha', age: '29' }));
      act(() => result.current.handleEditSave());
      expect(patient('p1')).toMatchObject({ firstName: 'Oysha', age: 29 });
      expect(toast.success).toHaveBeenCalledWith("Bemor ma'lumotlari yangilandi");
      expect(result.current.editOpen).toBe(false);
    });

    // BUG: handleEditSave bypasses PatientSchema — an empty/invalid age becomes 0 (or NaN for "abc"),
    // lastName can be emptied and the phone format is not checked. usePatientProfile.ts:59-68
    it.todo('rejects an empty or non-numeric age on edit — currently saved as 0 / NaN');
  });

  describe('tooth chart', () => {
    it('openToothEdit loads an existing record', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.openToothEdit(26));
      expect(result.current.selectedTooth).toBe(26);
      expect(result.current.toothForm).toEqual({ condition: 'cavity', notes: 'Kichik kariyes' });
      expect(result.current.toothModal).toBe(true);
    });

    it('openToothEdit defaults to healthy for an unrecorded tooth / no chart', () => {
      const { result } = renderHook(() => usePatientProfile('p3')); // no toothChart
      act(() => result.current.openToothEdit(11));
      expect(result.current.toothForm).toEqual({ condition: 'healthy', notes: '' });
    });

    it('handleToothSave writes the tooth and keeps the others', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2024-04-02T10:00:00Z'));
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.openToothEdit(26));
      act(() => result.current.setToothForm({ condition: 'filled', notes: 'Plomba' }));
      act(() => result.current.handleToothSave());
      vi.useRealTimers();
      const chart = patient('p1').toothChart!;
      expect(chart[26]).toEqual({ toothNumber: 26, condition: 'filled', notes: 'Plomba', date: '2024-04-02' });
      expect(chart[16]).toEqual(mockPatients[0].toothChart![16]);
      expect(mockPatients[0].toothChart![26].condition).toBe('cavity'); // mock not mutated
      expect(toast.success).toHaveBeenCalledWith("26-tish ma'lumoti yangilandi");
      expect(result.current.toothModal).toBe(false);
    });

    it('handleToothSave creates a chart for a patient without one', () => {
      const { result } = renderHook(() => usePatientProfile('p3'));
      act(() => result.current.openToothEdit(48));
      act(() => result.current.setToothForm({ condition: 'missing', notes: '' }));
      act(() => result.current.handleToothSave());
      expect(Object.keys(patient('p3').toothChart!)).toEqual(['48']);
    });

    it('handleToothSave without a selected tooth does nothing', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.handleToothSave());
      expect(patient('p1')).toBe(mockPatients[0]);
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('visits', () => {
    it('requires a doctor', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.handleVisitSave());
      expect(toast.error).toHaveBeenCalledWith('Shifokorni tanlang');
      expect(useStore.getState().visits).toHaveLength(mockVisits.length);
    });

    it('adds a visit for the patient and resets the form', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.setVisitModal(true));
      act(() => result.current.setVisitForm({ doctorId: 'd2', diagnosis: 'x', treatment: 'y', notes: 'z', status: 'completed' }));
      act(() => result.current.handleVisitSave());
      const v = useStore.getState().visits.at(-1)!;
      expect(v).toMatchObject({ patientId: 'p1', doctorId: 'd2', diagnosis: 'x', status: 'completed' });
      expect(v.id).toMatch(/^v\d+$/);
      expect(result.current.visitModal).toBe(false);
      expect(result.current.visitForm).toEqual({ doctorId: '', diagnosis: '', treatment: '', notes: '', status: 'not-started' });
      expect(result.current.patientVisits.map((x) => x.id)).toContain(v.id);
    });
  });

  describe('payments', () => {
    it.each([
      [{ amount: '', description: 'abc' }],
      [{ amount: '100', description: '' }],
    ])('requires amount and description (%o)', (patch) => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.setPayForm({ ...result.current.payForm, ...patch }));
      act(() => result.current.handlePaymentSave());
      expect(toast.error).toHaveBeenCalledWith("Majburiy maydonlarni to'ldiring");
      expect(useStore.getState().payments).toHaveLength(mockPayments.length);
    });

    it('adds a payment with numeric amount and updates totals', () => {
      const { result } = renderHook(() => usePatientProfile('p1'));
      act(() => result.current.setPaymentModal(true));
      act(() => result.current.setPayForm({ amount: '50000', method: 'card', status: 'paid', description: 'Tozalash' }));
      act(() => result.current.handlePaymentSave());
      const p = useStore.getState().payments.at(-1)!;
      expect(p).toMatchObject({ patientId: 'p1', amount: 50000, method: 'card', status: 'paid', description: 'Tozalash' });
      expect(result.current.totalPaid).toBe(200000);
      expect(result.current.paymentModal).toBe(false);
      expect(result.current.payForm).toEqual({ amount: '', method: 'cash', status: 'unpaid', description: '' });
      expect(toast.success).toHaveBeenCalledWith("To'lov qayd etildi");
    });
  });
});
