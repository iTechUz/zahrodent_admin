import type { Lead, LeadStatus } from '@/shared/types';
import { leadSourceLabel } from '@/shared/constants';
import { formatDate } from '@/shared/lib/formatters';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Yangi',
  contacted: "Bog'lanildi",
  consultation: 'Konsultatsiya',
  proposal: 'Taklif berildi',
  converted: 'Bemorga aylandi',
  cancelled: 'Bekor qilindi',
};

export const LEAD_LANG_LABELS: Record<string, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

/** "RU" / "EN" badge text; the default language (uz) and a missing value show nothing. */
export const leadLangBadge = (lang?: string | null): string | null => {
  const key = (lang ?? '').trim().toLowerCase();
  return key === 'ru' || key === 'en' ? LEAD_LANG_LABELS[key] : null;
};

/** Readable Excel rows: Uzbek headers, no ids / internal fields. */
export const leadsToExportRows = (leads: Lead[]): Record<string, string>[] =>
  leads.map((l) => ({
    Ism: l.name,
    Telefon: l.phone,
    Xizmat: l.service ?? '',
    Xabar: l.message ?? '',
    Izoh: l.notes ?? '',
    Holat: LEAD_STATUS_LABELS[l.status] ?? l.status,
    Manba: leadSourceLabel(l.source),
    Til: l.lang ? (LEAD_LANG_LABELS[l.lang.toLowerCase()] ?? l.lang) : '',
    Sana: l.createdAt ? formatDate(l.createdAt) : '',
  }));
