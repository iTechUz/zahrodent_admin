/**
 * Tiny pub/sub between the HTTP client and the app state, so `client.ts` does not
 * import the store (the store subscribes in `store/useStore.ts`).
 *
 * - `refreshed`: a new access token was obtained (silent refresh) — the store updates its
 *   token, which also makes the socket reconnect with it.
 * - `expired`: the session is gone (refresh failed / reused) — the store logs out.
 */
export type AuthEvent = { type: 'refreshed'; accessToken: string } | { type: 'expired' };

type Listener = (event: AuthEvent) => void;

const listeners = new Set<Listener>();

export function onAuthEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitAuthEvent(event: AuthEvent) {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {
      /* a listener must not break the request flow */
    }
  });
}
