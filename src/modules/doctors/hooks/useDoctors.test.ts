import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useDoctors } from './useDoctors';
import { useStore } from '@/store/useStore';
import { mockDoctors, mockVisits } from '@/mock/data';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const doctorForm = { name: 'Dr. New', specialty: 'Terapiya', phone: '+998 90 000 0000', workingHours: '9-18' };
const visitForm = { patientId: 'p5', status: 'in-progress' as const, diagnosis: 'd', treatment: 't', notes: '' };

describe('useDoctors', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('exposes store data and closed dialogs', () => {
    const { result } = renderHook(() => useDoctors());
    expect(result.current.doctors).toBe(mockDoctors);
    expect(result.current.visits).toBe(mockVisits);
    expect(result.current.modalOpen).toBe(false);
    expect(result.current.visitModal).toBe(false);
  });

  it('creates a doctor', () => {
    const { result } = renderHook(() => useDoctors());
    act(() => result.current.openCreate());
    act(() => result.current.handleSaveDoctor(doctorForm));
    const created = useStore.getState().doctors.at(-1)!;
    expect(created).toMatchObject(doctorForm);
    expect(created.id).toMatch(/^d\d+$/);
    expect(toast.success).toHaveBeenCalledWith("Yangi shifokor qo'shildi");
    expect(result.current.modalOpen).toBe(false);
  });

  it('updates the edited doctor', () => {
    const { result } = renderHook(() => useDoctors());
    act(() => result.current.openEdit(mockDoctors[1]));
    expect(result.current.editing).toBe(mockDoctors[1]);
    act(() => result.current.handleSaveDoctor(doctorForm));
    expect(useStore.getState().doctors[1]).toMatchObject({ ...doctorForm, id: 'd2' });
    expect(toast.success).toHaveBeenCalledWith("Shifokor ma'lumotlari yangilandi");
  });

  it('deletes by deleteId, no-op without one', () => {
    const { result } = renderHook(() => useDoctors());
    act(() => result.current.handleDeleteDoctor());
    expect(useStore.getState().doctors).toHaveLength(mockDoctors.length);
    act(() => result.current.setDeleteId('d4'));
    act(() => result.current.handleDeleteDoctor());
    expect(useStore.getState().doctors.some((d) => d.id === 'd4')).toBe(false);
    expect(result.current.deleteId).toBeNull();
  });

  it('handleSaveVisit without a selected doctor shows an error', () => {
    const { result } = renderHook(() => useDoctors());
    act(() => result.current.handleSaveVisit(visitForm));
    expect(toast.error).toHaveBeenCalledWith('Iltimos, shifokorni tanlang');
    expect(useStore.getState().visits).toHaveLength(mockVisits.length);
  });

  it('openVisitForm + handleSaveVisit creates a visit for that doctor', () => {
    const { result } = renderHook(() => useDoctors());
    act(() => result.current.openVisitForm(mockDoctors[2]));
    expect(result.current.visitModal).toBe(true);
    expect(result.current.selectedDoctor).toBe(mockDoctors[2]);
    expect(result.current.editingVisit).toBeNull();
    act(() => result.current.handleSaveVisit(visitForm));
    const v = useStore.getState().visits.at(-1)!;
    expect(v).toMatchObject({ ...visitForm, doctorId: 'd3' });
    expect(v.id).toMatch(/^v\d+$/);
    expect(v.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toast.success).toHaveBeenCalledWith('Yangi tashrif yaratildi');
    expect(result.current.visitModal).toBe(false);
  });

  it('openVisitForm with a visit edits it', () => {
    const { result } = renderHook(() => useDoctors());
    act(() => result.current.openVisitForm(mockDoctors[0], mockVisits[1]));
    expect(result.current.editingVisit).toBe(mockVisits[1]);
    act(() => result.current.handleSaveVisit({ ...visitForm, patientId: 'p2', status: 'completed' }));
    const v = useStore.getState().visits.find((x) => x.id === 'v2')!;
    expect(v.status).toBe('completed');
    expect(v.doctorId).toBe('d1');
    expect(useStore.getState().visits).toHaveLength(mockVisits.length);
    expect(toast.success).toHaveBeenCalledWith('Tashrif yangilandi');
  });
});
