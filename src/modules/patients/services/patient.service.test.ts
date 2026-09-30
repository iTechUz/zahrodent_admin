import type { Patient } from '@/shared/types';
import type { PatientFormValues } from '@/shared/lib/validation';
import { PatientService } from './patient.service';

const patient = {
  id: 'p1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  age: 30,
  phone: '+998901112233',
  address: 'Toshkent',
  workplace: 'IT',
  source: 'telegram',
  notes: '',
  createdAt: '2026-06-01',
} as Patient;

describe('PatientService', () => {
  it('initialState', () => {
    expect(PatientService.initialState()).toMatchObject({
      firstName: '',
      lastName: '',
      age: '',
      phone: '',
      source: 'walk-in',
      notes: '',
    });
  });

  it('mapToForm copies basic fields', () => {
    expect(PatientService.mapToForm(patient)).toMatchObject({
      firstName: 'Ali',
      lastName: 'Valiyev',
      age: 30,
      phone: '+998901112233',
      source: 'telegram',
      notes: '',
    });
  });

  it('validate returns the first zod message or null', () => {
    const valid: PatientFormValues = {
      firstName: 'Ali',
      lastName: 'V',
      phone: '+998901112233',
      age: 30,
      address: 'Toshkent',
      workplace: 'IT',
      source: 'walk-in',
    };
    expect(PatientService.validate(valid)).toBeNull();
    expect(PatientService.validate({ ...valid, phone: '901112233' })).toBe(
      "Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak",
    );
  });
});
