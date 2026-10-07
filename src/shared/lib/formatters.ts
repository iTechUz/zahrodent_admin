import { toClinicDate } from './date-utils';

/**
 * Format numbers as Uzbek Sum (UZS)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('uz-UZ').format(amount);
};

/**
 * Format date string to a more readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  // Date-only values have no time zone; full timestamps are shown in clinic time.
  let ymd = dateString;
  if (dateString.length > 10) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    ymd = toClinicDate(d);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : dateString;
};

const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

/** "7-oktabr, chorshanba" for a `YYYY-MM-DD` string (time-zone independent). */
export const formatDateLong = (ymd: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return ymd;
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${+m[3]}-${UZ_MONTHS[+m[2] - 1]}, ${UZ_WEEKDAYS[dt.getUTCDay()]}`;
};

/** Compact money for chart axes: 1 500 000 → "1,5 mln", 250 000 → "250 ming". */
export const formatCompactUzs = (amount: number): string => {
  const abs = Math.abs(amount);
  const trim = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
  if (abs >= 1_000_000_000) return `${trim(amount / 1_000_000_000)} mlrd`;
  if (abs >= 1_000_000) return `${trim(amount / 1_000_000)} mln`;
  if (abs >= 1_000) return `${trim(amount / 1_000)} ming`;
  return String(amount);
};

/**
 * Alias for formatCurrency specifically for 'so'm' suffix
 */
export const formatUzS = (amount: number): string => {
  return `${formatCurrency(amount)} so'm`;
};

/** "Firstname Lastname" of a doctor (the Doctor type has no `name` field). */
export const doctorFullName = (d: { firstName?: string; lastName?: string } | null | undefined): string =>
  d ? `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() : '';
