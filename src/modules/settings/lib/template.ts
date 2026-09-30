import { TEMPLATE_PLACEHOLDERS } from '@/lib/api/endpoints';
import { addDaysToDate, clinicToday } from '@/shared/lib/date-utils';

export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

export const PLACEHOLDER_LABELS: Record<TemplatePlaceholder, string> = {
  '{name}': 'Bemor ismi',
  '{date}': 'Qabul sanasi',
  '{time}': 'Qabul vaqti',
  '{doctor}': 'Shifokor',
  '{clinic}': 'Klinika nomi',
};

export type TemplateValues = Record<TemplatePlaceholder, string>;

/** Replace every known placeholder (all occurrences); unknown `{…}` stay as typed. */
export function renderTemplate(template: string, values: TemplateValues): string {
  return template.replace(/\{(\w+)\}/g, (match) =>
    match in values ? values[match as TemplatePlaceholder] : match,
  );
}

/** `{…}` tokens the backend does not know (typos like `{ism}`) — shown as a warning. */
export function findUnknownPlaceholders(template: string): string[] {
  const known = new Set<string>(TEMPLATE_PLACEHOLDERS);
  const found = template.match(/\{\w*\}/g) ?? [];
  return [...new Set(found.filter((p) => !known.has(p)))];
}

/** Insert `text` at the textarea selection (or the end) and return the new value + caret. */
export function insertAt(value: string, text: string, start?: number | null, end?: number | null) {
  const s = start ?? value.length;
  const e = end ?? s;
  const next = value.slice(0, s) + text + value.slice(e);
  return { value: next, caret: s + text.length };
}

/** `YYYY-MM-DD` → `DD.MM.YYYY` (the format the backend uses for {date}). */
export function toReminderDate(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return y && m && d ? `${d}.${m}.${y}` : ymd;
}

/** Sample values for the live preview. */
export function previewValues(clinicName: string, daysAhead: number, today = clinicToday()): TemplateValues {
  return {
    '{name}': 'Dilnoza Karimova',
    '{date}': toReminderDate(addDaysToDate(today, Number.isFinite(daysAhead) ? daysAhead : 0)),
    '{time}': '10:30',
    '{doctor}': 'Dr. Kamila Aliyeva',
    '{clinic}': clinicName || 'Zahro Dental',
  };
}
