export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export const AVATAR_TYPE_ERROR = "Rasm formati JPG, PNG yoki WEBP bo'lishi kerak";
export const AVATAR_SIZE_ERROR = "Rasm hajmi 3 MB dan oshmasligi kerak";

/** Client-side check before uploading (the backend re-checks by file content). Returns an error message or null. */
export function avatarFileError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ALLOWED.includes(file.type)) return AVATAR_TYPE_ERROR;
  if (file.size > AVATAR_MAX_BYTES) return AVATAR_SIZE_ERROR;
  return null;
}

/** Up to two initials for the placeholder, e.g. "Ali Valiyev" -> "AV". */
export function initials(...parts: Array<string | undefined | null>): string {
  return parts
    .flatMap((p) => (p ?? '').trim().split(/\s+/))
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
}
