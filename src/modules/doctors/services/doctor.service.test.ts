import type { Doctor } from '@/shared/types';
import { defaultDoctorSchedule } from '@/shared/lib/doctor-schedule';
import { DoctorService } from './doctor.service';

const doctor: Doctor = {
  id: 'd1',
  firstName: 'Aziz',
  lastName: 'Karimov',
  specialty: 'Terapevt',
  phone: '+998901112233',
  schedule: [{ day: 0, startTime: '08:00:00', endTime: '16:00:00', isWorking: true }],
  daysOff: ['2026-01-01', '2026-03-21'],
};

describe('DoctorService', () => {
  it('initialState has no password field and a default 7-day schedule', () => {
    const s = DoctorService.initialState();
    expect(s).toEqual({
      firstName: '',
      lastName: '',
      specialty: '',
      phone: '',
      schedule: defaultDoctorSchedule(),
      daysOffText: '',
    });
    expect(s).not.toHaveProperty('password');
  });

  it('mapToForm normalizes the schedule and joins days off', () => {
    const f = DoctorService.mapToForm(doctor);
    expect(f.schedule).toHaveLength(7);
    expect(f.schedule[0]).toEqual({ day: 0, startTime: '08:00', endTime: '16:00', isWorking: true });
    expect(f.daysOffText).toBe('2026-01-01, 2026-03-21');
    expect(f).not.toHaveProperty('password');
  });

  it('mapToForm with no days off gives ""', () => {
    expect(DoctorService.mapToForm({ ...doctor, daysOff: undefined }).daysOffText).toBe('');
    expect(DoctorService.mapToForm({ ...doctor, daysOff: [] }).daysOffText).toBe('');
  });

  it('validate', () => {
    expect(DoctorService.validate(DoctorService.initialState())).toBe('Ism kiritilishi shart');
    expect(DoctorService.validate(DoctorService.mapToForm(doctor))).toBeNull();
  });
});
