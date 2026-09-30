import { fetchAllPages, MAX_PAGE_LIMIT, withoutEmptyPassword } from './helpers';

describe('fetchAllPages', () => {
  const rows = Array.from({ length: 250 }, (_, i) => ({ id: i }));
  type P = { page?: number; limit?: number; search?: string };
  const list = vi.fn(async (p: P) => {
    const page = p?.page ?? 0;
    const limit = p?.limit ?? 10;
    return { data: rows.slice(page * limit, page * limit + limit), total: rows.length };
  });

  beforeEach(() => list.mockClear());

  it('never asks for more than 100 rows per request and returns every row', async () => {
    const res = await fetchAllPages(list, { search: 'a' });
    expect(res.total).toBe(250);
    expect(res.data).toHaveLength(250);
    expect(res.data.map((r) => r.id)).toEqual(rows.map((r) => r.id));
    expect(list).toHaveBeenCalledTimes(3);
    for (const [p] of list.mock.calls) {
      expect(p.limit).toBe(MAX_PAGE_LIMIT);
      expect(p.search).toBe('a');
    }
    expect(list.mock.calls.map(([p]) => p.page)).toEqual([0, 1, 2]);
  });

  it('a single page needs a single request', async () => {
    const one = vi.fn(async () => ({ data: [{ id: 1 }], total: 1 }));
    await fetchAllPages(one);
    expect(one).toHaveBeenCalledTimes(1);
  });

  it('empty list', async () => {
    const none = vi.fn(async () => ({ data: [], total: 0 }));
    expect(await fetchAllPages(none)).toEqual({ data: [], total: 0 });
  });

  it('respects maxPages as a safety cap', async () => {
    const res = await fetchAllPages(list, {}, { maxPages: 2 });
    expect(list).toHaveBeenCalledTimes(2);
    expect(res.data).toHaveLength(200);
  });
});

describe('withoutEmptyPassword', () => {
  it('drops an empty / whitespace / null password', () => {
    expect(withoutEmptyPassword({ a: 1, password: '' })).toEqual({ a: 1 });
    expect(withoutEmptyPassword({ a: 1, password: '   ' })).toEqual({ a: 1 });
    expect(withoutEmptyPassword({ a: 1, password: null })).toEqual({ a: 1 });
    expect('password' in withoutEmptyPassword({ a: 1, password: '' })).toBe(false);
  });

  it('keeps a real password', () => {
    expect(withoutEmptyPassword({ a: 1, password: 'secret1' })).toEqual({ a: 1, password: 'secret1' });
  });
});
