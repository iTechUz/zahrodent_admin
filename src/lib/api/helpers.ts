/**
 * Pure helpers around the API layer. Kept out of `endpoints.ts` so hook tests that
 * mock the endpoints module still get the real implementations.
 */

/** Backend `PaginationQueryDto` rejects `limit` > 100 with 400. */
export const MAX_PAGE_LIMIT = 100;

interface Page<T> {
  data: T[];
  total: number;
}

/**
 * Loads every page of a paginated list (page size = MAX_PAGE_LIMIT) — for lookups
 * (select options, name maps) and exports, where the backend's 100-row cap would
 * otherwise silently truncate the data. The first page tells the total; the rest
 * are fetched in parallel batches.
 */
export async function fetchAllPages<T, P extends { page?: number; limit?: number }>(
  list: (params: P) => Promise<Page<T>>,
  params: Omit<P, 'page' | 'limit'> = {} as Omit<P, 'page' | 'limit'>,
  { concurrency = 4, maxPages = 200 }: { concurrency?: number; maxPages?: number } = {},
): Promise<Page<T>> {
  const first = await list({ ...params, page: 0, limit: MAX_PAGE_LIMIT } as P);
  const total = first.total ?? first.data.length;
  const pages = Math.min(Math.ceil(total / MAX_PAGE_LIMIT), maxPages);
  const rest: T[][] = [];
  for (let start = 1; start < pages; start += concurrency) {
    const batch: Promise<T[]>[] = [];
    for (let page = start; page < Math.min(start + concurrency, pages); page++) {
      batch.push(list({ ...params, page, limit: MAX_PAGE_LIMIT } as P).then((r) => r.data));
    }
    rest.push(...(await Promise.all(batch)));
  }
  return { data: [...first.data, ...rest.flat()], total };
}

/** `password` is optional on doctor create/update — an empty value must be omitted (backend: MinLength(6) when present). */
export function withoutEmptyPassword<T extends { password?: string | null }>(body: T): T {
  if (body.password == null || String(body.password).trim() === '') {
    const rest = { ...body };
    delete rest.password;
    return rest;
  }
  return body;
}
