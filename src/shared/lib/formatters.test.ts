import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatUzS } from './formatters';

// Intl uses (narrow) no-break spaces as group separators; normalise for readable assertions.
const norm = (s: string) => s.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('groups thousands', () => {
    expect(norm(formatCurrency(1234567))).toBe('1 234 567');
  });
  it('formats zero', () => expect(formatCurrency(0)).toBe('0'));
  it('formats small numbers without separators', () => expect(formatCurrency(999)).toBe('999'));
  it('formats negatives', () => expect(norm(formatCurrency(-5000))).toMatch(/^[-−]5 000$/));
  it('uses a comma as decimal separator', () => expect(norm(formatCurrency(1500.5))).toBe('1 500,5'));
  it('matches Intl uz-UZ output exactly', () => {
    expect(formatCurrency(2400000)).toBe(new Intl.NumberFormat('uz-UZ').format(2400000));
  });
});

describe('formatUzS', () => {
  it("appends so'm", () => expect(norm(formatUzS(150000))).toBe("150 000 so'm"));
  it('handles zero', () => expect(formatUzS(0)).toBe("0 so'm"));
});

describe('formatDate', () => {
  it('returns empty string for empty input', () => expect(formatDate('')).toBe(''));
  it('returns empty string for null/undefined at runtime', () => {
    expect(formatDate(undefined as unknown as string)).toBe('');
    expect(formatDate(null as unknown as string)).toBe('');
  });
  it('formats a date-time in uz-UZ long form', () => {
    const out = formatDate('2024-03-31T12:00:00');
    expect(out).toBe(
      new Date('2024-03-31T12:00:00').toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }),
    );
    expect(out).toContain('2024');
    expect(out).toContain('31');
  });
  it('returns "Invalid Date" for unparsable input (no guard)', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });
});
