import {
  FORBIDDEN_MESSAGE,
  INVALID_INPUT_MESSAGE,
  NOT_FOUND_MESSAGE,
  SERVER_ERROR_MESSAGE,
  TOO_MANY_REQUESTS_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
  toUserMessage,
} from './error-messages';

describe('toUserMessage', () => {
  it('translates the throttler error from the login screenshot', () => {
    expect(toUserMessage(429, 'ThrottlerException: Too Many Requests')).toBe(TOO_MANY_REQUESTS_MESSAGE);
    expect(toUserMessage(400, 'ThrottlerException: Too Many Requests')).toBe(TOO_MANY_REQUESTS_MESSAGE);
  });

  it('hides server faults and proxy HTML behind one Uzbek sentence', () => {
    expect(toUserMessage(500, 'Internal server error')).toBe(SERVER_ERROR_MESSAGE);
    expect(toUserMessage(502, '<html>Bad Gateway</html>')).toBe(SERVER_ERROR_MESSAGE);
    expect(toUserMessage(503, undefined)).toBe(SERVER_ERROR_MESSAGE);
  });

  it('maps well-known English texts and validator output', () => {
    expect(toUserMessage(403, 'Forbidden resource')).toBe(FORBIDDEN_MESSAGE);
    expect(toUserMessage(404, 'Not Found')).toBe(NOT_FOUND_MESSAGE);
    expect(toUserMessage(400, 'phone must be a string; name should not be empty')).toBe(INVALID_INPUT_MESSAGE);
  });

  it('falls back by status when there is no text, and keeps Uzbek backend messages as they are', () => {
    expect(toUserMessage(418, '')).toBe(UNKNOWN_ERROR_MESSAGE);
    expect(toUserMessage(404, '')).toBe(NOT_FOUND_MESSAGE);
    expect(toUserMessage(401, "Telefon yoki parol noto'g'ri")).toBe("Telefon yoki parol noto'g'ri");
  });
});
