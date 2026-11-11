import { redirectToLogin, registerLoginRedirect, rememberReturnPath, safeReturnPath, takeReturnPath } from './return-to';

describe('safeReturnPath (open-redirect safe)', () => {
  it.each(['/', '/patients', '/patients/12?tab=history', '/finance#top'])('accepts %s', (p) => {
    expect(safeReturnPath(p)).toBe(p);
  });

  it.each([
    '//evil.com',
    '//evil.com/path',
    'https://evil.com',
    'http://evil.com/',
    'javascript:alert(1)',
    '/\\evil.com',
    '/\\/evil.com',
    '\\\\evil.com',
    'patients',
    '',
    '/login',
    '/login?x=1',
    '/a\nb',
    '/a\tb',
    '/' + 'a'.repeat(600),
  ])('rejects %j', (p) => {
    expect(safeReturnPath(p)).toBeNull();
  });

  it('rejects non-strings', () => {
    expect(safeReturnPath(undefined)).toBeNull();
    expect(safeReturnPath(null)).toBeNull();
    expect(safeReturnPath({ a: 1 })).toBeNull();
  });
});

describe('remember / take', () => {
  beforeEach(() => sessionStorage.clear());

  it('stores a safe path once and clears it when taken', () => {
    rememberReturnPath('/patients/5?tab=x');
    expect(takeReturnPath()).toBe('/patients/5?tab=x');
    expect(takeReturnPath()).toBeNull();
  });

  it('never stores an unsafe path', () => {
    rememberReturnPath('//evil.com');
    expect(takeReturnPath()).toBeNull();
  });

  it('ignores a tampered stored value', () => {
    sessionStorage.setItem('zahro_return_to', 'https://evil.com');
    expect(takeReturnPath()).toBeNull();
    expect(sessionStorage.getItem('zahro_return_to')).toBeNull();
  });
});

describe('redirectToLogin', () => {
  afterEach(() => registerLoginRedirect(null));

  it('uses the registered SPA navigator', () => {
    const nav = vi.fn();
    registerLoginRedirect(nav);
    redirectToLogin();
    expect(nav).toHaveBeenCalledTimes(1);
  });
});
