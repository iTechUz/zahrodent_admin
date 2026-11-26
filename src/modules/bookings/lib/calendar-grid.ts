import type { Booking, Doctor } from '@/shared/types';
import { addDaysToDate } from '@/shared/lib/date-utils';

export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;

const pad = (n: number) => String(n).padStart(2, '0');

/** `["08:00","08:30",…,"19:30"]` */
export function slotTimes(startHour = DAY_START_HOUR, endHour = DAY_END_HOUR, step = SLOT_MINUTES): string[] {
  const out: string[] = [];
  for (let m = startHour * 60; m < endHour * 60; m += step) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

/** Monday of the week containing `ymd`. */
export function weekStart(ymd: string): string {
  const weekday = (new Date(`${ymd}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Mon
  return addDaysToDate(ymd, -weekday);
}

/** The 7 days Mon–Sun of the week containing `ymd`. */
export function weekDays(ymd: string): string[] {
  const start = weekStart(ymd);
  return Array.from({ length: 7 }, (_, i) => addDaysToDate(start, i));
}

/** Slot a booking time falls into (rounded down to the slot grid), e.g. "09:45" -> "09:30". */
export function slotOf(time: string, step = SLOT_MINUTES): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  const total = h * 60 + m;
  const floored = total - (total % step);
  return `${pad(Math.floor(floored / 60))}:${pad(floored % 60)}`;
}

/** Clinic-local "HH:mm" of an instant (Asia/Tashkent). */
export function clinicTimeNow(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}`;
}

/** A new booking can't start in the past (backend 400): the slot must not have ended yet. */
export function isSlotPast(date: string, slot: string, today: string, nowTime: string, step = SLOT_MINUTES): boolean {
  if (date < today) return true;
  if (date > today) return false;
  const [h, m] = slot.split(':').map(Number);
  const end = h * 60 + m + step;
  const [nh, nm] = nowTime.split(':').map(Number);
  return end <= nh * 60 + nm;
}

/** Does the doctor work at that date/time? Mirrors the backend rule: no working day set = unrestricted. */
export function doctorWorksAt(doctor: Pick<Doctor, 'schedule' | 'daysOff'> | undefined, date: string, time: string): boolean {
  if (!doctor) return true;
  if (doctor.daysOff?.includes(date)) return false;
  const schedule = doctor.schedule ?? [];
  if (!schedule.some((s) => s.isWorking)) return true;
  const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const slot = schedule.find((s) => Number(s.day) === weekday);
  if (!slot?.isWorking) return false;
  return time >= slot.startTime.slice(0, 5) && time < slot.endTime.slice(0, 5);
}

/** Bookings that start in a slot of a given date (cancelled ones included — they are shown struck through). */
export function bookingsInSlot(bookings: Booking[], date: string, slot: string, doctorId?: string): Booking[] {
  return bookings
    .filter((b) => b.date === date && slotOf(b.time) === slot && (!doctorId || b.doctorId === doctorId))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** A booking that still occupies its slot (cancelled / no-show free it). */
export const occupiesSlot = (b: Pick<Booking, 'status'>) => b.status !== 'cancelled' && b.status !== 'no-show';
