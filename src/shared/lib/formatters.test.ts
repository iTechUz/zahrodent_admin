import { formatCurrency, formatDate, formatUzS } from './formatters';

/** Intl uses NBSP (U+00A0) as the uz-UZ group separator. */
const norm = (s: string) => s.replace(/\u00a0|\u202f/g, ' ');

describe('formatCurrency', () => {
  it('groups thousands with spaces (uz-UZ)', () => {
    expect(norm(formatCurrency(1234567))).toBe('1 234 567');
    expect(norm(formatCurrency(300000))).toBe('300 000');
  });

  it('handles small numbers, zero and negatives', () => {
    expect(formatCurrency(999)).toBe('999');
    expect(formatCurrency(0)).toBe('0');
    expect(norm(formatCurrency(-15000))).toBe('-15 000');
  });

  it('uses a comma as the decimal separator', () => {
    expect(norm(formatCurrency(1500.5))).toBe('1 500,5');
  });
});

describe('formatUzS', () => {
  it("appends the so'm suffix", () => {
    expect(norm(formatUzS(250000))).toBe("250 000 so'm");
    expect(formatUzS(0)).toBe("0 so'm");
  });
});

describe('formatDate', () => {
  it('formats as DD/MM/YYYY', () => {
    // build the ISO string from a local noon so the expected day holds in any timezone
    expect(formatDate(new Date(2026, 5, 10, 12).toISOString())).toBe('10/06/2026');
    expect(formatDate(new Date(2026, 0, 5, 12).toISOString())).toBe('05/01/2026');
  });

  it('returns "" for an empty string', () => {
    expect(formatDate('')).toBe('');
  });
});
