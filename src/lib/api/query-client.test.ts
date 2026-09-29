import { toast } from 'sonner';
import { ApiError } from './client';
import { createQueryClient, getErrorMessage, GENERIC_QUERY_ERROR, reportQueryError } from './query-client';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe('getErrorMessage', () => {
  it('uses the ApiError (backend) message', () => {
    expect(getErrorMessage(new ApiError(403, "Ruxsat yo'q"))).toBe("Ruxsat yo'q");
  });
  it('falls back to a generic message for unknown errors', () => {
    expect(getErrorMessage(new Error('x'))).toBe(GENERIC_QUERY_ERROR);
    expect(getErrorMessage('boom', 'custom')).toBe('custom');
  });
});

describe('reportQueryError', () => {
  it('toasts the message, de-duplicated by id', () => {
    reportQueryError(new ApiError(500, 'Server xatosi'));
    expect(toast.error).toHaveBeenCalledWith('Server xatosi', { id: 'query-error:Server xatosi' });
  });

  it('skips 401 (the client already redirects to /login)', () => {
    reportQueryError(new ApiError(401, 'Unauthorized'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('respects meta.silentError and meta.errorMessage', () => {
    reportQueryError(new ApiError(500, 'x'), { meta: { silentError: true } });
    expect(toast.error).not.toHaveBeenCalled();
    reportQueryError(new ApiError(500, 'x'), { meta: { errorMessage: 'Bemorlar yuklanmadi' } });
    expect(toast.error).toHaveBeenCalledWith('Bemorlar yuklanmadi', { id: 'query-error:Bemorlar yuklanmadi' });
  });
});

describe('createQueryClient', () => {
  it('a failing query shows a toast instead of failing silently', async () => {
    const qc = createQueryClient();
    await qc
      .fetchQuery({ queryKey: ['x'], queryFn: () => Promise.reject(new ApiError(403, 'Taqiqlangan')), retry: false })
      .catch(() => {});
    expect(toast.error).toHaveBeenCalledWith('Taqiqlangan', expect.anything());
  });

  it('does not retry 4xx, retries network/5xx once', () => {
    const qc = createQueryClient();
    const retry = qc.getDefaultOptions().queries?.retry as (n: number, e: unknown) => boolean;
    expect(retry(0, new ApiError(404, 'nf'))).toBe(false);
    expect(retry(0, new ApiError(0, 'net'))).toBe(true);
    expect(retry(0, new ApiError(502, 'bad gw'))).toBe(true);
    expect(retry(1, new ApiError(502, 'bad gw'))).toBe(false);
  });

  it('mutation errors toast the ApiError message (not 401)', () => {
    const qc = createQueryClient();
    const onError = qc.getDefaultOptions().mutations?.onError as (e: unknown) => void;
    onError(new ApiError(409, 'Vaqt band'));
    expect(toast.error).toHaveBeenCalledWith('Vaqt band');
    vi.mocked(toast.error).mockClear();
    onError(new ApiError(401, 'x'));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
