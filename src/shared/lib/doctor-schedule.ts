import type { DoctorSchedule } from '@/shared/types';

export const DOCTOR_WEEKDAY_LABELS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'] as const;

export function defaultDoctorSchedule(): DoctorSchedule[] {
  return DOCTOR_WEEKDAY_LABELS.map((_, day) => ({
    day,
    startTime: '09:00',
    endTime: '17:00',
    isWorking: false,
  }));
}

/** API / seed dan kelgan jadvalni forma uchun 7 kunga to'ldiradi */
export function normalizeDoctorSchedule(raw?: DoctorSchedule[] | null): DoctorSchedule[] {
  const base = defaultDoctorSchedule();
  if (!raw?.length) return base;
  return base.map((slot) => {
    const found = raw.find((s) => Number(s.day) === slot.day);
    if (!found) return slot;
    const start = String(found.startTime ?? '09:00').slice(0, 5);
    const end = String(found.endTime ?? '17:00').slice(0, 5);
    const bs = hhmm(found.breakStart);
    const be = hhmm(found.breakEnd);
    return {
      day: slot.day,
      startTime: start,
      endTime: end,
      isWorking: !!found.isWorking,
      // optional lunch break: kept only when both ends are present (older schedules have none)
      ...(bs && be ? { breakStart: bs, breakEnd: be } : {}),
    };
  });
}

/** "HH:mm" (or "HH:mm:ss") → "HH:mm"; anything else → undefined */
function hhmm(v: unknown): string | undefined {
  return typeof v === 'string' && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : undefined;
}

/** Schedule weekday index (0 = Du … 6 = Ya) of a `YYYY-MM-DD` date. */
export function scheduleDayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export type DoctorDayInfo =
  | { kind: 'day-off' } // listed in doctor.daysOff
  | { kind: 'not-working' } // weekly schedule marks the weekday as a rest day
  | { kind: 'working'; startTime: string; endTime: string; breakStart?: string; breakEnd?: string };

/**
 * What the doctor's schedule says about one date (read-only hint for the booking form).
 * `null` = no schedule data → nothing to show (the backend still validates).
 */
export function doctorDayInfo(
  doctor: { schedule?: DoctorSchedule[] | null; daysOff?: string[] | null } | null | undefined,
  date: string,
): DoctorDayInfo | null {
  if (!doctor || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (doctor.daysOff?.some((d) => String(d).slice(0, 10) === date)) return { kind: 'day-off' };
  if (!doctor.schedule?.length) return null;
  const slot = normalizeDoctorSchedule(doctor.schedule)[scheduleDayIndex(date)];
  if (!slot.isWorking) return { kind: 'not-working' };
  return {
    kind: 'working',
    startTime: slot.startTime,
    endTime: slot.endTime,
    ...(slot.breakStart && slot.breakEnd ? { breakStart: slot.breakStart, breakEnd: slot.breakEnd } : {}),
  };
}

/** `time` (HH:mm) lies inside [breakStart, breakEnd) */
export function isInBreak(time: string, breakStart?: string, breakEnd?: string): boolean {
  return !!(time && breakStart && breakEnd && time >= breakStart && time < breakEnd);
}
