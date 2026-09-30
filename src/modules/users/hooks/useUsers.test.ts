import { act, renderHook, waitFor } from '@testing-library/react';
import { usersApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs, makeUser } from '@/test/utils';
import { useUsers } from './useUsers';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const api = vi.mocked(usersApi);

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => useUsers(), { wrapper }), invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('admin');
});

describe('useUsers', () => {
  it('loads /users when authenticated', async () => {
    const users = [makeUser('admin'), makeUser('doctor', { specialty: 'Terapevt' })];
    api.list.mockResolvedValue(users);
    const { result } = setup();
    expect(result.current.users).toEqual([]);
    await waitFor(() => expect(result.current.users).toEqual(users));
    expect(result.current.isLoading).toBe(false);
  });

  it('does not load when logged out', async () => {
    loginAs(null);
    setup();
    await Promise.resolve();
    expect(api.list).not.toHaveBeenCalled();
  });

  it('create: handleSave with no editing user → POST /users', async () => {
    api.create.mockResolvedValue(makeUser('receptionist'));
    const { result, invalidate } = setup();
    act(() => result.current.openCreate());
    expect(result.current.modalOpen).toBe(true);
    const body = { name: 'Ali', phone: '+998901112233', role: 'receptionist' as const, password: 'secret1' };
    act(() => result.current.handleSave(body));
    await waitFor(() => expect(result.current.modalOpen).toBe(false));
    expect(api.create).toHaveBeenCalledWith(body);
    expect(api.update).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(toastMock.success).toHaveBeenCalledWith("Xodim ma'lumotlari saqlandi");
  });

  it('edit: handleSave with editing user → PATCH /users/:id', async () => {
    api.update.mockResolvedValue(makeUser('doctor'));
    const { result } = setup();
    const user = makeUser('doctor', { id: 'u9', specialty: 'Xirurg' });
    act(() => result.current.openEdit(user));
    expect(result.current.editing).toEqual(user);
    act(() => result.current.handleSave({ name: 'New' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('u9', { name: 'New' }));
  });

  it('delete', async () => {
    api.remove.mockResolvedValue({ id: 'u1' });
    const { result, invalidate } = setup();
    act(() => result.current.handleDelete());
    expect(api.remove).not.toHaveBeenCalled();
    act(() => result.current.setDeleteId('u1'));
    act(() => result.current.handleDelete());
    await waitFor(() => expect(result.current.deleteId).toBeNull());
    expect(api.remove.mock.calls[0][0]).toBe('u1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(toastMock.success).toHaveBeenCalledWith("Xodim o'chirildi");
  });

  it('sorting is sent to GET /users (sortBy + order)', async () => {
    api.list.mockResolvedValue([]);
    const { result } = setup();
    await waitFor(() => expect(api.list).toHaveBeenCalledWith(undefined));
    act(() => result.current.setSort({ sortBy: 'name', order: 'desc' }));
    await waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ sortBy: 'name', order: 'desc' }));
  });
});
