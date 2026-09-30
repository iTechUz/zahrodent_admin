import { QueryCache, QueryClient, type Query } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './client';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** don't toast on failure (the component shows its own error state) */
      silentError?: boolean;
      /** custom toast text instead of the server message */
      errorMessage?: string;
    };
  }
}

export const GENERIC_QUERY_ERROR = "Ma'lumotlarni yuklashda xatolik yuz berdi";

/** Human-readable message for any thrown value (ApiError carries the backend message). */
export function getErrorMessage(err: unknown, fallback = GENERIC_QUERY_ERROR): string {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

/** "So'rov ID: …" line for support, when the backend sent a `requestId`. */
export function getRequestIdLabel(err: unknown): string | undefined {
  return err instanceof ApiError && err.requestId ? `So'rov ID: ${err.requestId}` : undefined;
}

/** Toast a failed query. 401 is skipped (client already redirects to /login); identical messages are de-duplicated. */
export function reportQueryError(err: unknown, query?: Pick<Query, 'meta'>) {
  if (query?.meta?.silentError) return;
  if (err instanceof ApiError && err.status === 401) return;
  const message = query?.meta?.errorMessage ?? getErrorMessage(err);
  toast.error(message, { id: `query-error:${message}`, description: getRequestIdLabel(err) });
}

function shouldRetry(failureCount: number, err: unknown) {
  // 4xx won't fix itself (validation, 403, 404) — retry network/5xx once
  if (err instanceof ApiError && err.status >= 400 && err.status < 500) return false;
  return failureCount < 1;
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (err, query) => reportQueryError(err, query),
    }),
    defaultOptions: {
      queries: { staleTime: 60_000, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: {
        onError: (err) => {
          if (err instanceof ApiError && err.status !== 401)
            toast.error(err.message, { description: getRequestIdLabel(err) });
          else if (!(err instanceof ApiError)) toast.error("Amalni bajarishda xatolik yuz berdi");
        },
      },
    },
  });
}
