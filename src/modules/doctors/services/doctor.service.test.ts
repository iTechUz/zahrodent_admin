import { describe, expect, it } from 'vitest';
import { DoctorService } from './doctor.service';
import { mockDoctors } from '@/mock/data';

describe('DoctorService', () => {
  it('initialState is an empty form', () => {
    expect(DoctorService.initialState()).toEqual({ name: '', specialty: '', phone: '', workingHours: '' });
  });

  it('mapToForm picks only form fields', () => {
    const d = mockDoctors[0];
    expect(DoctorService.mapToForm(d)).toEqual({
      name: d.name, specialty: d.specialty, phone: d.phone, workingHours: d.workingHours,
    });
  });

  it('validate: all mock doctors are valid', () => {
    mockDoctors.forEach((d) => expect(DoctorService.validate(DoctorService.mapToForm(d))).toBeNull());
  });

  it('validate: empty form reports the name first', () => {
    expect(DoctorService.validate(DoctorService.initialState())).toBe('Ism familiya kiritilishi shart');
  });

  it('validate: bad phone', () => {
    expect(DoctorService.validate({ ...DoctorService.mapToForm(mockDoctors[0]), phone: '12' })).toBe(
      "Noto'g'ri telefon raqami",
    );
  });
});
