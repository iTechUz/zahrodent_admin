/**
 * Runtime configuration.
 *
 * In the production Docker image `/env-config.js` is generated at container start
 * (see docker/40-env-config.sh) and defines `window.__ENV__`, so the same image can be
 * pointed at another API with `docker run --env-file …` without a rebuild.
 * In dev (`npm run dev`) the file only contains an empty object and the build-time
 * `import.meta.env.VITE_API_URL` from `.env` is used.
 */
export interface RuntimeEnv {
  VITE_API_URL?: string;
}

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

export const DEFAULT_API_URL = 'http://localhost:3000';

function nonEmpty(v: string | undefined | null): string | undefined {
  const t = v?.trim();
  return t ? t : undefined;
}

/** API base URL: runtime `window.__ENV__` → build-time env → localhost; always with a protocol, no trailing slash. */
export function resolveApiUrl(): string {
  const runtime = typeof window !== 'undefined' ? nonEmpty(window.__ENV__?.VITE_API_URL) : undefined;
  let url = runtime ?? nonEmpty(import.meta.env.VITE_API_URL) ?? DEFAULT_API_URL;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}
