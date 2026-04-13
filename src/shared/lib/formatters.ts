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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Alias for formatCurrency specifically for 'so'm' suffix
 */
export const formatUzS = (amount: number): string => {
  return `${formatCurrency(amount)} so'm`;
};
