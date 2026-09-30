import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { authApi, loginRequest, settingsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { AUTH_NOTICE_KEY, REFRESH_TOKEN_KEY } from '@/lib/api/auth-token';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, makeUser } from '@/test/utils';
import { useStore } from '@/store/useStore';
import type { ClinicSettings } from '@/shared/types';
import type { UserRole } from '@/shared/types/auth';
import SettingsPage from './SettingsPage';
import { PASSWORD_CHANGED_RELOGIN_MESSAGE } from '../hooks/useChangePassword';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const SETTINGS: ClinicSettings = {
  clinicName: 'Zahro Dental',
  address: 'Toshkent',
  phone: '+998 71 200 00 00',
  workingHours: '09:00–18:00',
  smsReminderTemplate: 'Hurmatli {name}, {date} {time} da {doctor} qabulida kutamiz. {clinic}',
  telegramReminderTemplate: 'Eslatma: {date} {time}',
  reminderDaysAhead: 1,
};

const originalLocation = window.location;

function renderPage(role: UserRole = 'admin') {
  loginAs(role);
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Radix tabs activate on mousedown */
function openTab(name: RegExp) {
  fireEvent.mouseDown(screen.getByRole('tab', { name }), { button: 0 });
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  vi.mocked(settingsApi.get).mockResolvedValue(SETTINGS);
  vi.mocked(settingsApi.update).mockImplementation(async (body) => ({ ...SETTINGS, ...body }));
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('SettingsPage — clinic info', () => {
  it('loads GET /settings into the form', async () => {
    renderPage();
    expect(await screen.findByDisplayValue('Zahro Dental')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Toshkent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00–18:00')).toBeInTheDocument();
  });

  it('admin saves only the clinic fields (PATCH, partial)', async () => {
    renderPage('admin');
    const name = await screen.findByDisplayValue('Zahro Dental');
    fireEvent.change(name, { target: { value: 'Zahro Dental Plus' } });
    fireEvent.click(screen.getByRole('button', { name: /Saqlash/ }));
    await waitFor(() => expect(settingsApi.update).toHaveBeenCalledTimes(1));
    expect(settingsApi.update).toHaveBeenCalledWith({
      clinicName: 'Zahro Dental Plus',
      address: 'Toshkent',
      phone: '+998 71 200 00 00',
      workingHours: '09:00–18:00',
    });
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Sozlamalar saqlandi'));
  });

  it('validates: clinic name is required', async () => {
    renderPage('admin');
    const name = await screen.findByDisplayValue('Zahro Dental');
    fireEvent.change(name, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Saqlash/ }));
    expect(await screen.findByText('Klinika nomini kiriting')).toBeInTheDocument();
    expect(settingsApi.update).not.toHaveBeenCalled();
  });

  it.each<UserRole>(['doctor', 'receptionist'])('%s sees the settings read-only', async (role) => {
    renderPage(role);
    const name = await screen.findByDisplayValue('Zahro Dental');
    expect(name).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent("faqat administrator o'zgartira oladi");
    expect(screen.queryByRole('button', { name: /Saqlash/ })).toBeNull();
  });

  it('shows an error state when settings fail to load', async () => {
    vi.mocked(settingsApi.get).mockRejectedValue(new ApiError(500, 'Server xatosi'));
    renderPage();
    expect(await screen.findByText('Sozlamalar yuklanmadi')).toBeInTheDocument();
  });

  it('has no fake switches (backup / Eskiz / 2FA) any more', async () => {
    renderPage();
    await screen.findByDisplayValue('Zahro Dental');
    expect(screen.queryByText(/Avtomatik zaxiralash/)).toBeNull();
    expect(screen.queryByText(/Ikki bosqichli/)).toBeNull();
  });
});

describe('SettingsPage — reminder templates', () => {
  it('renders a live preview with the placeholders replaced', async () => {
    renderPage();
    await screen.findByDisplayValue('Zahro Dental');
    openTab(/Eslatmalar/);
    const preview = await screen.findByTestId('smsReminderTemplate-preview');
    expect(preview.textContent).toMatch(/^Hurmatli Dilnoza Karimova, \S+ 10:30 da Dr\. Kamila Aliyeva qabulida kutamiz\. Zahro Dental$/);
    expect(preview.textContent).not.toContain('{');
  });

  it('a placeholder chip inserts into the template and updates the preview', async () => {
    renderPage();
    await screen.findByDisplayValue('Zahro Dental');
    openTab(/Eslatmalar/);
    const textarea = await screen.findByDisplayValue('Eslatma: {date} {time}');
    fireEvent.change(textarea, { target: { value: 'Salom ' } });
    const chips = screen.getByLabelText("Telegram shablon: o'rinbosarlar");
    fireEvent.click(within(chips).getByRole('button', { name: '{name}' }));
    expect(textarea).toHaveValue('Salom {name}');
    expect(screen.getByTestId('telegramReminderTemplate-preview')).toHaveTextContent('Salom Dilnoza Karimova');
  });

  it('warns about unknown placeholders', async () => {
    renderPage();
    await screen.findByDisplayValue('Zahro Dental');
    openTab(/Eslatmalar/);
    const textarea = await screen.findByDisplayValue('Eslatma: {date} {time}');
    fireEvent.change(textarea, { target: { value: 'Salom {ism}' } });
    expect(await screen.findByText(/Noma'lum o'rinbosar: \{ism\}/)).toBeInTheDocument();
  });

  it('validates reminderDaysAhead 0..7 and an empty template', async () => {
    renderPage();
    await screen.findByDisplayValue('Zahro Dental');
    openTab(/Eslatmalar/);
    const days = await screen.findByLabelText('Necha kun oldin eslatilsin');
    fireEvent.change(days, { target: { value: '9' } });
    fireEvent.change(screen.getByDisplayValue('Eslatma: {date} {time}'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Saqlash/ }));
    expect(await screen.findByText('7 kundan oshmasin')).toBeInTheDocument();
    expect(screen.getByText('Telegram shablon matnini kiriting')).toBeInTheDocument();
    expect(settingsApi.update).not.toHaveBeenCalled();
  });

  it('saves templates + days (numbers, not strings)', async () => {
    renderPage();
    await screen.findByDisplayValue('Zahro Dental');
    openTab(/Eslatmalar/);
    fireEvent.change(await screen.findByLabelText('Necha kun oldin eslatilsin'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Saqlash/ }));
    await waitFor(() =>
      expect(settingsApi.update).toHaveBeenCalledWith({
        smsReminderTemplate: SETTINGS.smsReminderTemplate,
        telegramReminderTemplate: SETTINGS.telegramReminderTemplate,
        reminderDaysAhead: 2,
      }),
    );
  });

  it('read-only for non-admins: no chips, disabled textareas', async () => {
    renderPage('receptionist');
    await screen.findByDisplayValue('Zahro Dental');
    openTab(/Eslatmalar/);
    expect(await screen.findByDisplayValue('Eslatma: {date} {time}')).toBeDisabled();
    expect(screen.queryByLabelText("SMS shablon: o'rinbosarlar")).toBeNull();
  });
});

describe('SettingsPage — change password', () => {
  async function openPasswordTab(role: UserRole = 'doctor') {
    renderPage(role);
    openTab(/Xavfsizlik/);
    const current = await screen.findByLabelText('Joriy parol');
    const next = screen.getByLabelText('Yangi parol');
    const confirm = screen.getByLabelText('Parolni tasdiqlash');
    const fill = (a: string, b: string, c: string) => {
      fireEvent.change(current, { target: { value: a } });
      fireEvent.change(next, { target: { value: b } });
      fireEvent.change(confirm, { target: { value: c } });
      fireEvent.click(screen.getByRole('button', { name: 'Parolni yangilash' }));
    };
    return { fill };
  }

  it('validates length and confirmation', async () => {
    const { fill } = await openPasswordTab();
    fill('old', 'short', 'other');
    expect(await screen.findByText("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak")).toBeInTheDocument();
    expect(screen.getByText('Parollar mos kelmadi')).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('rejects a new password equal to the current one', async () => {
    const { fill } = await openPasswordTab();
    fill('samepass1', 'samepass1', 'samepass1');
    expect(await screen.findByText('Yangi parol joriy paroldan farq qilishi kerak')).toBeInTheDocument();
  });

  it('on success re-logs in with the new password and keeps the session', async () => {
    const user = makeUser('doctor', { doctorId: 'd1' });
    vi.mocked(authApi.changePassword).mockResolvedValue({ success: true });
    vi.mocked(loginRequest).mockResolvedValue({ access_token: 'a2', refresh_token: 'r2', expires_in: 900, user });
    const { fill } = await openPasswordTab('doctor');
    act(() => useStore.setState({ currentUser: user }));

    fill('oldpass12', 'newpass12', 'newpass12');

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Parol muvaffaqiyatli o'zgartirildi"));
    expect(authApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'oldpass12', newPassword: 'newpass12' });
    expect(loginRequest).toHaveBeenCalledWith({ phone: user.phone, password: 'newpass12' });
    expect(useStore.getState()).toMatchObject({ token: 'a2', isAuthenticated: true });
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('r2');
    expect(screen.getByLabelText('Joriy parol')).toHaveValue('');
  });

  it('shows the backend error inline ("Joriy parol noto\'g\'ri")', async () => {
    vi.mocked(authApi.changePassword).mockRejectedValue(new ApiError(400, "Joriy parol noto'g'ri"));
    const { fill } = await openPasswordTab();
    fill('wrongpass', 'newpass12', 'newpass12');
    expect(await screen.findByRole('alert')).toHaveTextContent("Joriy parol noto'g'ri");
    expect(loginRequest).not.toHaveBeenCalled();
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('if the re-login fails, ends the session with a message', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/settings', assign },
    });
    vi.mocked(authApi.changePassword).mockResolvedValue({ success: true });
    vi.mocked(loginRequest).mockRejectedValue(new ApiError(429, 'Juda ko‘p urinish'));
    const { fill } = await openPasswordTab();
    fill('oldpass12', 'newpass12', 'newpass12');
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'));
    expect(sessionStorage.getItem(AUTH_NOTICE_KEY)).toBe(PASSWORD_CHANGED_RELOGIN_MESSAGE);
    expect(useStore.getState().isAuthenticated).toBe(false);
  });
});
