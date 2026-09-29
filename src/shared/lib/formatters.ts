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

/**
 * Alias for formatCurrency specifically for 'so'm' suffix
 */
export const formatUzS = (amount: number): string => {
  return `${formatCurrency(amount)} so'm`;
};

/** "Firstname Lastname" of a doctor (the Doctor type has no `name` field). */
export const doctorFullName = (d: { firstName?: string; lastName?: string } | null | undefined): string =>
  d ? `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() : '';
