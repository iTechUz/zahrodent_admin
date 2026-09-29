/**
 * Clinic-local date helpers.
 *
 * The clinic works in Asia/Tashkent (UTC+5). `new Date().toISOString()` is UTC, so
 * between 00:00 and 04:59 Tashkent time it yields *yesterday*. Every "today" /
 * "this month" / date-only value sent to the backend must come from here.
 */
export const CLINIC_TIME_ZONE = 'Asia/Tashkent';

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `YYYY-MM-DD` of the given instant in the clinic time zone. */
export function toClinicDate(date: Date = new Date()): string {
  const parts = ymdFormatter.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Today in the clinic time zone (`YYYY-MM-DD`). */
export function clinicToday(now: Date = new Date()): string {
  return toClinicDate(now);
}

/** Calendar arithmetic on a `YYYY-MM-DD` string (time-zone independent). */
export function addDaysToDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Adds calendar months to a `YYYY-MM-DD` string, clamping to the month end (Jan 31 + 1 → Feb 28). */
export function addMonthsToDate(ymd: string, months: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

/** First day of the current clinic month (`YYYY-MM-01`). */
export function clinicMonthStart(now: Date = new Date()): string {
  return `${clinicToday(now).slice(0, 7)}-01`;
}

/** Current clinic month key (`YYYY-MM`). */
export function clinicMonthKey(now: Date = new Date()): string {
  return clinicToday(now).slice(0, 7);
}

/**
 * Get Month to Date (MTD) range formatted as YYYY-MM-DD (clinic time zone).
 */
export const getMonthToDateRange = (now: Date = new Date()) => ({
  startDate: clinicMonthStart(now),
  endDate: '',
});
