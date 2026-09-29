import { DOCTOR_WEEKDAY_LABELS, defaultDoctorSchedule, normalizeDoctorSchedule } from './doctor-schedule';

describe('DOCTOR_WEEKDAY_LABELS', () => {
  it('starts the week on Monday (0 = Du)', () => {
    expect(DOCTOR_WEEKDAY_LABELS).toEqual(['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya']);
  });
});

describe('defaultDoctorSchedule', () => {
  it('returns 7 non-working 09:00–17:00 slots numbered 0..6', () => {
    const s = defaultDoctorSchedule();
    expect(s).toHaveLength(7);
    s.forEach((slot, i) => expect(slot).toEqual({ day: i, startTime: '09:00', endTime: '17:00', isWorking: false }));
  });

  it('returns a fresh array each call', () => {
    const a = defaultDoctorSchedule();
    a[0].isWorking = true;
    expect(defaultDoctorSchedule()[0].isWorking).toBe(false);
  });
});

describe('normalizeDoctorSchedule', () => {
  it('returns the default schedule for undefined / null / []', () => {
    for (const raw of [undefined, null, []]) {
      expect(normalizeDoctorSchedule(raw)).toEqual(defaultDoctorSchedule());
    }
  });

  it('fills missing days, keeps provided days, trims seconds from times', () => {
    const out = normalizeDoctorSchedule([
      { day: 2, startTime: '08:30:00', endTime: '14:00:00', isWorking: true },
      { day: 6, startTime: '10:00', endTime: '12:00', isWorking: false },
    ]);
    expect(out).toHaveLength(7);
    expect(out[2]).toEqual({ day: 2, startTime: '08:30', endTime: '14:00', isWorking: true });
    expect(out[6]).toEqual({ day: 6, startTime: '10:00', endTime: '12:00', isWorking: false });
    expect(out[0]).toEqual({ day: 0, startTime: '09:00', endTime: '17:00', isWorking: false });
  });

  it('accepts string day numbers and truthy isWorking from seed data', () => {
    const out = normalizeDoctorSchedule([
      { day: '1' as unknown as number, startTime: '09:00', endTime: '18:00', isWorking: 1 as unknown as boolean },
    ]);
    expect(out[1]).toEqual({ day: 1, startTime: '09:00', endTime: '18:00', isWorking: true });
  });

  it('falls back to default times when they are missing', () => {
    const out = normalizeDoctorSchedule([
      { day: 3, isWorking: true } as unknown as { day: number; startTime: string; endTime: string; isWorking: boolean },
    ]);
    expect(out[3]).toEqual({ day: 3, startTime: '09:00', endTime: '17:00', isWorking: true });
  });

  it('ignores out-of-range days', () => {
    const out = normalizeDoctorSchedule([{ day: 9, startTime: '01:00', endTime: '02:00', isWorking: true }]);
    expect(out).toEqual(defaultDoctorSchedule());
  });
});
