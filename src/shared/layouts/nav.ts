/**
 * Is the nav item `itemPath` ("/patients") active for the current `pathname` ("/patients/123")?
 * Compares the first path segment, so detail pages keep their section highlighted; "/" matches only "/".
 */
export function isNavActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') return pathname === '/';
  const first = '/' + (pathname.split('/')[1] ?? '');
  return first === itemPath;
}
