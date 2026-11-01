import { resolveGuideUrl } from '@/lib/api/runtime-config';

/**
 * Admin route → section id on the user guide page (landing `/qollanma/#<id>`).
 * Keep the ids in sync with the guide content (zahro-landing `lib/guide.ts`).
 */
const GUIDE_SECTIONS: Array<[RegExp, string]> = [
  [/^\/patients\/[^/]+/, 'bemor-kartasi'],
  [/^\/patients/, 'bemorlar'],
  [/^\/bookings/, 'bron'],
  [/^\/leads/, 'murojaatlar'],
  [/^\/notifications/, 'eslatma'],
  [/^\/pharmacy/, 'apteka'],
  [/^\/finance/, 'moliya'],
  [/^\/doctors/, 'shifokorlar'],
  [/^\/services/, 'xizmatlar'],
  [/^\/analytics/, 'tahlillar'],
  [/^\/settings/, 'sozlamalar'],
  [/^\/users/, 'xodimlar'],
];

/** Guide URL that opens at the section matching the current page (top of the guide for unknown pages). */
export function guideUrlFor(pathname: string): string {
  const hit = GUIDE_SECTIONS.find(([re]) => re.test(pathname));
  return resolveGuideUrl() + (hit ? `#${hit[1]}` : '');
}
