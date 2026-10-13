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
  return new Date(dateString).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** "13.10.2026 16:08" (clinic time zone) for ISO timestamps such as comment.createdAt. */
export const formatDateTime = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('day')}.${g('month')}.${g('year')} ${g('hour')}:${g('minute')}`;
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
