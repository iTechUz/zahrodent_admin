import { AVATAR_MAX_BYTES, AVATAR_SIZE_ERROR, AVATAR_TYPE_ERROR, avatarFileError, initials } from './avatar-file';

describe('avatarFileError', () => {
  it('accepts JPG, PNG and WEBP up to 3 MB', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(avatarFileError({ type, size: AVATAR_MAX_BYTES })).toBeNull();
    }
  });
  it('rejects other types and oversized files', () => {
    expect(avatarFileError({ type: 'image/gif', size: 10 })).toBe(AVATAR_TYPE_ERROR);
    expect(avatarFileError({ type: 'application/pdf', size: 10 })).toBe(AVATAR_TYPE_ERROR);
    expect(avatarFileError({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })).toBe(AVATAR_SIZE_ERROR);
  });
});

describe('initials', () => {
  it('uses the first letters of the first two words', () => {
    expect(initials('Ali', 'Valiyev')).toBe('AV');
    expect(initials('ali valiyev oglu')).toBe('AV');
    expect(initials('', undefined)).toBe('');
  });
});
