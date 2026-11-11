/**
 * Turns whatever the server (or a proxy) sent into a short Uzbek sentence for the user.
 * Uzbek backend messages pass through untouched; English/technical ones ("ThrottlerException:
 * Too Many Requests", "Internal Server Error", class-validator text, proxy HTML) are replaced.
 */

export const TOO_MANY_REQUESTS_MESSAGE = "Juda ko'p urinish bo'ldi. Bir ozdan keyin qayta urinib ko'ring";
export const SERVER_ERROR_MESSAGE = "Serverda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring";
export const INVALID_INPUT_MESSAGE = "Kiritilgan ma'lumotlar noto'g'ri. Maydonlarni tekshirib, qayta urinib ko'ring";
export const FORBIDDEN_MESSAGE = "Bu amalni bajarish uchun ruxsatingiz yo'q";
export const NOT_FOUND_MESSAGE = "So'ralgan ma'lumot topilmadi";
export const CONFLICT_MESSAGE = "Bu ma'lumot allaqachon mavjud yoki boshqa yozuv bilan to'qnashdi";
export const UNAUTHORIZED_MESSAGE = 'Avval tizimga kiring';
export const UNKNOWN_ERROR_MESSAGE = "Xatolik yuz berdi. Qayta urinib ko'ring";

const KNOWN: Record<string, string> = {
  'too many requests': TOO_MANY_REQUESTS_MESSAGE,
  'internal server error': SERVER_ERROR_MESSAGE,
  'bad gateway': SERVER_ERROR_MESSAGE,
  'service unavailable': SERVER_ERROR_MESSAGE,
  'gateway timeout': SERVER_ERROR_MESSAGE,
  'bad request': INVALID_INPUT_MESSAGE,
  'bad request exception': INVALID_INPUT_MESSAGE,
  'unprocessable entity': INVALID_INPUT_MESSAGE,
  forbidden: FORBIDDEN_MESSAGE,
  'forbidden resource': FORBIDDEN_MESSAGE,
  'not found': NOT_FOUND_MESSAGE,
  conflict: CONFLICT_MESSAGE,
  unauthorized: UNAUTHORIZED_MESSAGE,
  'request failed': UNKNOWN_ERROR_MESSAGE,
  'failed to fetch': UNKNOWN_ERROR_MESSAGE,
};

/** class-validator / Nest default texts ("phone must be a string", "name should not be empty"). */
const VALIDATOR_TEXT = /\b(must be|must not be|should not be|should be|must contain|must match|is not valid|is required)\b/i;

function byStatus(status: number): string {
  if (status === 429) return TOO_MANY_REQUESTS_MESSAGE;
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  if (status === 401) return UNAUTHORIZED_MESSAGE;
  if (status === 403) return FORBIDDEN_MESSAGE;
  if (status === 404) return NOT_FOUND_MESSAGE;
  if (status === 409) return CONFLICT_MESSAGE;
  if (status === 400 || status === 422) return INVALID_INPUT_MESSAGE;
  return UNKNOWN_ERROR_MESSAGE;
}

export function toUserMessage(status: number, raw: string | undefined | null): string {
  // throttling and server faults never carry a useful user-facing text
  if (status === 429 || status >= 500) return byStatus(status);
  const text = (raw ?? '').trim();
  if (!text || text.startsWith('<')) return byStatus(status);
  const bare = text.replace(/^\w*Exception:\s*/, '');
  const known = KNOWN[bare.toLowerCase().replace(/[.!]+$/, '')];
  if (known) return known;
  if (VALIDATOR_TEXT.test(bare)) return INVALID_INPUT_MESSAGE;
  return bare;
}
