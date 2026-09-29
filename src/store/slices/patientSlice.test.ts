import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store/useStore';
import { mockPatients } from '@/mock/data';
import { Patient } from '@/shared/types';
import { describeCrudSlice } from '@/test/crudSliceCases';
import { resetStore } from '@/test/resetStore';

const newPatient = (): Patient => ({
  id: 'p-new',
  firstName: 'Ali',
  lastName: 'Valiyev',
  age: 30,
  phone: '+998 90 000 0000',
  source: 'walk-in',
  notes: '',
  createdAt: '2024-04-01',
});

describeCrudSlice<Patient>({
  name: 'patientSlice',
  listKey: 'patients',
  initial: mockPatients,
  add: (s, p) => s.addPatient(p),
  update: (s, id, p) => s.updatePatient(id, p),
  remove: (s, id) => s.deletePatient(id),
  makeNew: newPatient,
  patch: { firstName: 'Yangilangan', age: 99 },
});

describe('patientSlice specifics', () => {
  beforeEach(resetStore);

  it('replaces the tooth chart wholesale on update', () => {
    const chart = { 11: { toothNumber: 11, condition: 'implant' as const } };
    useStore.getState().updatePatient('p1', { toothChart: chart });
    expect(useStore.getState().patients[0].toothChart).toEqual(chart);
    expect(mockPatients[0].toothChart?.[16]).toBeDefined();
  });

  it('deleting a patient does not cascade to bookings or payments', () => {
    useStore.getState().deletePatient('p1');
    expect(useStore.getState().bookings.some((b) => b.patientId === 'p1')).toBe(true);
    expect(useStore.getState().payments.some((p) => p.patientId === 'p1')).toBe(true);
  });
});
