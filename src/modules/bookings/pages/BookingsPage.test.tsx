import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { bookingsApi, doctorsApi, patientsApi, servicesApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient } from '@/shared/types';
import BookingsPage from './BookingsPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const mk = (id: string, extra: Partial<Booking> = {}) =>
  ({
    id,
    patientId: 'p1',
    patient: { firstName: 'Ali', lastName: 'Valiyev' },
    doctorId: 'd1',
    date: '2026-06-17',
    time: '10:00',
    status: 'pending',
    source: 'phone',
    serviceId: 's1',
    createdAt: '',
    ...extra,
  }) as Booking;

const doctor = { id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' } as Doctor;

function renderPage(url = '/bookings') {
  return render(
    <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={createTestQueryClient()}>
        <BookingsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T07:00:00Z'));
  loginAs('receptionist');
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated([doctor]));
  vi.mocked(servicesApi.list).mockResolvedValue(paginated([]));
  vi.mocked(bookingsApi.stats).mockResolvedValue({ today: 1, pending: 1, completedToday: 0 });
  vi.mocked(bookingsApi.list).mockResolvedValue(paginated([mk('b1')]));
});
afterEach(() => vi.useRealTimers());

describe('BookingsPage', () => {
  it('opens on the "Bugun" view with today\'s bookings and a doctor name', async () => {
    renderPage();
    expect(await screen.findByRole('tab', { name: /Bugun/ })).toHaveAttribute('data-state', 'active');
    expect(await screen.findByRole('link', { name: 'Ali Valiyev' })).toHaveAttribute('href', '/patients/p1');
    expect(bookingsApi.list).toHaveBeenCalledWith(expect.objectContaining({ startDate: '2026-06-17', endDate: '2026-06-17' }));
  });

  it('completing asks for confirmation first, then PATCHes only after "Ha"', async () => {
    vi.mocked(bookingsApi.update).mockResolvedValue(mk('b1', { status: 'completed' }));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Yakunlandi/ }));
    expect(bookingsApi.update).not.toHaveBeenCalled();
    expect(await screen.findByText('Qabulni yakunlaysizmi?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Ha, o'zgartirish" }));
    await waitFor(() => expect(bookingsApi.update).toHaveBeenCalledWith('b1', { status: 'completed' }));
    // undo toast with the previous status
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        'Holat "Yakunlangan" ga o\'zgartirildi',
        expect.objectContaining({ action: expect.objectContaining({ label: 'Qaytarish' }) }),
      ),
    );
  });

  it('"Keldi" is harmless → no confirm, straight PATCH', async () => {
    vi.mocked(bookingsApi.update).mockResolvedValue(mk('b1', { status: 'arrived' }));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Keldi/ }));
    await waitFor(() => expect(bookingsApi.update).toHaveBeenCalledWith('b1', { status: 'arrived' }));
  });

  it('a booking without a service cannot be completed (guard before the request)', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([mk('b1', { serviceId: undefined })]));
    renderPage();
    const btn = await screen.findByRole('button', { name: /Yakunlandi/ });
    expect(btn).toBeDisabled();
    expect(bookingsApi.update).not.toHaveBeenCalled();
  });

  it('?booking=ID deep link opens that booking\'s details', async () => {
    vi.mocked(bookingsApi.get).mockResolvedValue(mk('b9', { notes: 'Chuqur karies' }));
    renderPage('/bookings?booking=b9');
    expect(await screen.findByText('Qabul tafsilotlari')).toBeInTheDocument();
    expect(await screen.findByText('Chuqur karies')).toBeInTheDocument();
    expect(bookingsApi.get).toHaveBeenCalledWith('b9');
  });

  it('?new=1&patientId=… opens the create form with that patient preselected', async () => {
    vi.mocked(patientsApi.get).mockResolvedValue({ id: 'p5', firstName: 'Sardor', lastName: 'Qodirov', phone: '+998901112233' } as Patient);
    renderPage('/bookings?new=1&patientId=p5');
    expect(await screen.findByText('Yangi qabul yaratish')).toBeInTheDocument();
    await waitFor(() => expect(patientsApi.get).toHaveBeenCalledWith('p5'));
    await waitFor(() =>
      expect(screen.getAllByRole('combobox').some((c) => /Sardor Qodirov/.test(c.textContent ?? ''))).toBe(true),
    );
  });

  it('?new=1 is ignored for roles that cannot create bookings', async () => {
    loginAs('doctor', { doctorId: 'd1' });
    renderPage('/bookings?new=1');
    await screen.findByRole('tab', { name: /Bugun/ });
    expect(screen.queryByText('Yangi qabul yaratish')).toBeNull();
  });
});
