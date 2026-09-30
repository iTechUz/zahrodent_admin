import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient } from '@/shared/types';
import { BookingCalendar } from './BookingCalendar';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T07:00:00Z'));
  loginAs('admin');
  vi.mocked(bookingsApi.list).mockResolvedValue(
    paginated([
      { id: 'b1', patientId: 'p1', doctorId: 'd1', date: '2026-06-17', time: '10:00', status: 'pending', source: 'phone' },
    ] as Booking[]),
  );
  vi.mocked(patientsApi.list).mockResolvedValue(paginated([{ id: 'p1', firstName: 'Ali', lastName: 'Valiyev' }] as Patient[]));
  vi.mocked(doctorsApi.list).mockResolvedValue(
    paginated([{ id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' }] as Doctor[]),
  );
});

afterEach(() => vi.useRealTimers());

function renderCalendar() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <BookingCalendar />
    </QueryClientProvider>,
  );
}

describe('BookingCalendar', () => {
  it('booking details show the doctor full name (firstName lastName), not the missing `name`', async () => {
    renderCalendar();
    const chip = await screen.findByRole('button', { name: /Ali/ });
    fireEvent.click(chip);
    expect(await screen.findByText('Dr. Aziz Karimov')).toBeInTheDocument();
    expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
  });

  it('loads only the visible grid range, max 100 rows per request', async () => {
    renderCalendar();
    await waitFor(() => expect(bookingsApi.list).toHaveBeenCalled());
    // June 2026 grid: Mon 2026-06-01 … Sun 2026-07-12 (6 weeks)
    expect(bookingsApi.list).toHaveBeenCalledWith({ startDate: '2026-06-01', endDate: '2026-07-12', page: 0, limit: 100 });
    expect(doctorsApi.list).toHaveBeenCalledWith({ page: 0, limit: 100 });
  });
});
