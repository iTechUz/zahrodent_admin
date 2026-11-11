import { isNavActive } from './nav';

describe('isNavActive', () => {
  it('matches exact and nested paths of the same section', () => {
    expect(isNavActive('/patients', '/patients')).toBe(true);
    expect(isNavActive('/patients/123', '/patients')).toBe(true);
    expect(isNavActive('/patients/123/', '/patients')).toBe(true);
    expect(isNavActive('/doctors/d1', '/doctors')).toBe(true);
  });

  it('"/" is active only on the dashboard', () => {
    expect(isNavActive('/', '/')).toBe(true);
    expect(isNavActive('/patients', '/')).toBe(false);
  });

  it('does not confuse sections sharing a prefix', () => {
    expect(isNavActive('/patients-archive', '/patients')).toBe(false);
    expect(isNavActive('/services', '/settings')).toBe(false);
    expect(isNavActive('/', '/patients')).toBe(false);
  });
});
