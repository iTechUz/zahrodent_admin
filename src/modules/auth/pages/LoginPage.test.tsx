import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { loginRequest } from '@/lib/api/endpoints';
import { ApiError, NETWORK_ERROR_MESSAGE } from '@/lib/api/client';
import { AUTH_NOTICE_KEY, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_AT_KEY } from '@/lib/api/auth-token';
import { useStore } from '@/store/useStore';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { loginAs, makeUser } from '@/test/utils';
import LoginPage from './LoginPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const login = vi.mocked(loginRequest);

function renderPage() {
  const utils = render(<LoginPage />);
  const phone = screen.getByLabelText('Telefon raqami') as HTMLInputElement;
  const password = screen.getByLabelText('Parol') as HTMLInputElement;
  const form = phone.closest('form')!;
  const fill = (p: string, pw: string) => {
    fireEvent.input(phone, { target: { value: p } });
    fireEvent.change(password, { target: { value: pw } });
  };
  return { ...utils, phone, password, form, fill };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  loginAs(null);
});

describe('LoginPage', () => {
  it('renders the phone field pre-filled with the +998 mask and "remember me" checked', () => {
    const { phone } = renderPage();
    expect(phone.value).toMatch(/^\+998/);
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    expect(screen.getByRole('button', { name: 'Kirish' })).toBeEnabled();
  });

  it('requires both fields', () => {
    const { form } = renderPage();
    fireEvent.submit(form);
    expect(screen.getByText("Iltimos, barcha maydonlarni to'ldiring")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('rejects an incomplete phone number', () => {
    const { form, fill } = renderPage();
    fill('+998 90 123', 'secret');
    fireEvent.submit(form);
    expect(screen.getByText("Telefon raqami noto'g'ri formatda (+998XXXXXXXXX)")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in with the normalized +998XXXXXXXXX phone and stores a remembered session', async () => {
    const user = makeUser('admin', { name: 'Ali' });
    login.mockResolvedValue({ access_token: 'jwt-1', user });
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'secret');
    fireEvent.submit(form);

    await waitFor(() => expect(useStore.getState().isAuthenticated).toBe(true));
    expect(login).toHaveBeenCalledWith({ phone: '+998901234567', password: 'secret' });
    expect(useStore.getState().currentUser).toEqual(user);
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-1');
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(toastMock.success).toHaveBeenCalledWith('Xush kelibsiz, Ali!');
  });

  it('without "remember me" the session goes to sessionStorage', async () => {
    login.mockResolvedValue({ access_token: 'jwt-2', user: makeUser('doctor') });
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'secret');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    fireEvent.submit(form);

    await waitFor(() => expect(useStore.getState().isAuthenticated).toBe(true));
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-2');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('shows the backend message for an ApiError (e.g. wrong password)', async () => {
    login.mockRejectedValue(new ApiError(401, "Telefon raqami yoki parol noto'g'ri"));
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'wrong');
    fireEvent.submit(form);
    expect(await screen.findByText("Telefon raqami yoki parol noto'g'ri")).toBeInTheDocument();
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(screen.getByRole('button', { name: 'Kirish' })).toBeEnabled();
  });

  it('shows a network message (not "wrong password") when the server is unreachable', async () => {
    login.mockRejectedValue(new ApiError(0, NETWORK_ERROR_MESSAGE));
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'x');
    fireEvent.submit(form);
    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(/parol noto'g'ri/)).not.toBeInTheDocument();
  });

  it('a raw fetch TypeError is also reported as a network problem', async () => {
    login.mockRejectedValue(new TypeError('Failed to fetch'));
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'x');
    fireEvent.submit(form);
    expect(await screen.findByText(NETWORK_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('an unexpected error shows a generic message', async () => {
    login.mockRejectedValue(new Error('weird'));
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'x');
    fireEvent.submit(form);
    expect(await screen.findByText("Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring")).toBeInTheDocument();
  });

  it('disables the button while the request is pending', async () => {
    let resolve!: (v: Awaited<ReturnType<typeof loginRequest>>) => void;
    login.mockReturnValue(new Promise((r) => (resolve = r)));
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'secret');
    fireEvent.submit(form);
    const button = await screen.findByRole('button', { name: /Kirish\.\.\./ });
    expect(button).toBeDisabled();
    await act(async () => resolve({ access_token: 't', user: makeUser('admin') }));
  });

  it('clears the error when the user edits a field', () => {
    const { form, password } = renderPage();
    fireEvent.submit(form);
    expect(screen.getByText("Iltimos, barcha maydonlarni to'ldiring")).toBeInTheDocument();
    fireEvent.change(password, { target: { value: 'a' } });
    expect(screen.queryByText("Iltimos, barcha maydonlarni to'ldiring")).not.toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    const { password } = renderPage();
    expect(password).toHaveAttribute('type', 'password');
    const toggle = password.parentElement!.querySelector('button[type="button"]')!;
    fireEvent.click(toggle);
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(toggle);
    expect(password).toHaveAttribute('type', 'password');
  });

  it('stores the refresh token and expiry from the login response', async () => {
    login.mockResolvedValue({ access_token: 'a1', refresh_token: 'r1', expires_in: 900, user: makeUser('admin') });
    const { form, fill } = renderPage();
    fill('+998 90 123 45 67', 'secret');
    fireEvent.submit(form);
    await waitFor(() => expect(useStore.getState().isAuthenticated).toBe(true));
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('r1');
    expect(Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY))).toBeGreaterThan(Date.now());
    expect(useStore.getState().token).toBe('a1');
  });

  it('shows the "session expired" notice left by the API client until the next login', async () => {
    sessionStorage.setItem(AUTH_NOTICE_KEY, 'Sessiya muddati tugagan, qayta kiring');
    const { unmount } = renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Sessiya muddati tugagan, qayta kiring');
    unmount();
    // e.g. the SPA rendered /login, then the hard redirect reloaded it
    const { form, fill } = renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
    login.mockResolvedValue({ access_token: 'a', refresh_token: 'r', user: makeUser('admin') });
    fill('+998 90 123 45 67', 'secret');
    fireEvent.submit(form);
    await waitFor(() => expect(useStore.getState().isAuthenticated).toBe(true));
    expect(sessionStorage.getItem(AUTH_NOTICE_KEY)).toBeNull();
  });
});
