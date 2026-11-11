import {
  DOCTOR_WEEKDAY_LABELS,
  defaultDoctorSchedule,
  doctorDayInfo,
  isInBreak,
  normalizeDoctorSchedule,
  scheduleDayIndex,
} from './doctor-schedule';

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

describe('lunch break (optional)', () => {
  it('keeps breakStart/breakEnd (trimmed to HH:mm) only when both are present; old schedules are unchanged', () => {
    const out = normalizeDoctorSchedule([
      { day: 0, startTime: '09:00', endTime: '18:00', isWorking: true, breakStart: '13:00:00', breakEnd: '14:00' },
      { day: 1, startTime: '09:00', endTime: '18:00', isWorking: true, breakStart: '13:00' },
      { day: 2, startTime: '09:00', endTime: '18:00', isWorking: true },
    ]);
    expect(out[0]).toEqual({ day: 0, startTime: '09:00', endTime: '18:00', isWorking: true, breakStart: '13:00', breakEnd: '14:00' });
    expect(out[1]).not.toHaveProperty('breakStart');
    expect(out[2]).toEqual({ day: 2, startTime: '09:00', endTime: '18:00', isWorking: true });
  });
});

describe('scheduleDayIndex', () => {
  it('maps a date to 0 = Du … 6 = Ya', () => {
    expect(scheduleDayIndex('2026-06-15')).toBe(0); // Monday
    expect(scheduleDayIndex('2026-06-17')).toBe(2); // Wednesday
    expect(scheduleDayIndex('2026-06-21')).toBe(6); // Sunday
  });
});

describe('doctorDayInfo', () => {
  const schedule = normalizeDoctorSchedule([
    { day: 2, startTime: '09:00', endTime: '18:00', isWorking: true, breakStart: '13:00', breakEnd: '14:00' },
  ]);
  it('returns null without data to show', () => {
    expect(doctorDayInfo(undefined, '2026-06-17')).toBeNull();
    expect(doctorDayInfo({ schedule: [] }, '2026-06-17')).toBeNull();
    expect(doctorDayInfo({ schedule }, '')).toBeNull();
  });
  it('day off wins, then rest weekday, then working hours with the break', () => {
    expect(doctorDayInfo({ schedule, daysOff: ['2026-06-17'] }, '2026-06-17')).toEqual({ kind: 'day-off' });
    expect(doctorDayInfo({ schedule }, '2026-06-16')).toEqual({ kind: 'not-working' });
    expect(doctorDayInfo({ schedule }, '2026-06-17')).toEqual({
      kind: 'working',
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    });
  });
});

describe('isInBreak', () => {
  it('is true from breakStart up to (excluding) breakEnd', () => {
    expect(isInBreak('13:00', '13:00', '14:00')).toBe(true);
    expect(isInBreak('13:59', '13:00', '14:00')).toBe(true);
    expect(isInBreak('14:00', '13:00', '14:00')).toBe(false);
    expect(isInBreak('13:30')).toBe(false);
  });
});
