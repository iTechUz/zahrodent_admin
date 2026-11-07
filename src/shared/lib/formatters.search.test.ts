import { normalizeSearch } from './formatters';

describe('normalizeSearch', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeSearch('  Ali   Valiyev \n')).toBe('Ali Valiyev');
  });
  it('maps apostrophe variants to ASCII', () => {
    for (const a of ['’', 'ʻ', 'ʼ', '‘', '`', '´']) expect(normalizeSearch(`G${a}ulomqodirov`)).toBe("G'ulomqodirov");
  });
  it('leaves phone-like text alone', () => {
    expect(normalizeSearch('+998 90 123-45-67')).toBe('+998 90 123-45-67');
  });
});
