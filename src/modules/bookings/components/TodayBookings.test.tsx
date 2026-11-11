import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor } from '@/shared/types';
import { TodayBookings, todayActions } from './TodayBookings';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const mk = (id: string, time: string, extra: Partial<Booking> = {}) =>
  ({
    id,
    patientId: `p-${id}`,
    patient: { firstName: `Bemor${id}`, lastName: 'T' },
    doctorId: 'd1',
    date: '2026-06-17',
    time,
    status: 'pending',
    source: 'phone',
    serviceId: 's1',
    ...extra,
  }) as Booking;

const doctors = [{ id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' }] as Doctor[];

function renderToday(props: Partial<React.ComponentProps<typeof TodayBookings>> = {}) {
  const onRequestStatus = vi.fn();
  const onOpen = vi.fn();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={createTestQueryClient()}>
        <TodayBookings doctors={doctors} canUpdate onRequestStatus={onRequestStatus} onOpen={onOpen} {...props} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return { onRequestStatus, onOpen };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T07:00:00Z'));
  loginAs('admin');
});
afterEach(() => vi.useRealTimers());

describe('todayActions', () => {
  it('offers Keldi / Yakunlandi / Kelmadi only while the booking is still open', () => {
    expect(todayActions('pending')).toEqual(['arrived', 'completed', 'no-show']);
    expect(todayActions('arrived')).toEqual(['completed', 'no-show']);
    expect(todayActions('completed')).toEqual([]);
    expect(todayActions('cancelled')).toEqual([]);
  });
});

describe('TodayBookings', () => {
  it("asks the server for today's bookings only and lists them sorted by time", async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([mk('b2', '14:00'), mk('b1', '09:30')]));
    renderToday();
    await screen.findByText('Bemorb1 T');
    expect(bookingsApi.list).toHaveBeenCalledWith({ startDate: '2026-06-17', endDate: '2026-06-17', page: 0, limit: 100 });
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('09:30')).toBeInTheDocument();
    expect(within(items[1]).getByText('14:00')).toBeInTheDocument();
    // the patient name is a real link
    expect(screen.getByRole('link', { name: 'Bemorb1 T' })).toHaveAttribute('href', '/patients/p-b1');
  });

  it('inline actions go through onRequestStatus', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([mk('b1', '09:30')]));
    const { onRequestStatus } = renderToday();
    fireEvent.click(await screen.findByRole('button', { name: /Keldi/ }));
    expect(onRequestStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }), 'arrived');
  });

  it('"Yakunlandi" is disabled (with a tooltip) when the booking has no service', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([mk('b1', '09:30', { serviceId: undefined })]));
    renderToday();
    const btn = await screen.findByRole('button', { name: /Yakunlandi/ });
    expect(btn).toBeDisabled();
    expect(btn.parentElement).toHaveAttribute('title', 'Yakunlash uchun xizmat tanlang');
  });

  it('no action buttons without update permission', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([mk('b1', '09:30')]));
    renderToday({ canUpdate: false });
    await screen.findByText('Bemorb1 T');
    expect(screen.queryByRole('button', { name: /Keldi/ })).toBeNull();
  });

  it('shows an empty state when there is nothing today', async () => {
    renderToday();
    expect(await screen.findByText("Bugun qabullar yo'q")).toBeInTheDocument();
  });
});
