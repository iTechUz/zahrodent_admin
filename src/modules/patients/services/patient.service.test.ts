import { describe, expect, it } from 'vitest';
import { PatientService } from './patient.service';
import { mockPatients } from '@/mock/data';
import { PatientFormValues } from '@/shared/lib/validation';

describe('PatientService', () => {
  it('initialState is an empty walk-in form with age as empty string', () => {
    expect(PatientService.initialState()).toEqual({
      firstName: '', lastName: '', age: '', phone: '', source: 'walk-in', notes: '', allergies: '', bloodType: '',
    });
  });

  it('mapToForm copies fields and defaults optional ones to empty string', () => {
    const p = mockPatients[2]; // no allergies
    expect(PatientService.mapToForm(p)).toEqual({
      firstName: p.firstName, lastName: p.lastName, age: p.age, phone: p.phone, source: p.source,
      notes: p.notes, allergies: '', bloodType: p.bloodType,
    });
    expect(PatientService.mapToForm({ ...p, notes: undefined, bloodType: undefined })).toMatchObject({
      notes: '', bloodType: '',
    });
  });

  it('validate: all mock patients are valid', () => {
    mockPatients.forEach((p) =>
      expect(PatientService.validate(PatientService.mapToForm(p) as PatientFormValues)).toBeNull(),
    );
  });

  it('validate: empty form reports first name first', () => {
    expect(PatientService.validate(PatientService.initialState() as PatientFormValues)).toBe('Ism kiritilishi shart');
  });

  it('validate: missing age', () => {
    const form = { ...PatientService.mapToForm(mockPatients[0]), age: '' } as unknown as PatientFormValues;
    expect(PatientService.validate(form)).toBe("Yosh musbat son bo'lishi shart");
  });
});
