import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient } from '@/shared/types';
import { DraggableBookingCalendar, isPastCalendarDate } from './DraggableBookingCalendar';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const mk = (i: number, extra: Partial<Booking> = {}) =>
  ({ id: `b${i}`, patientId: 'p1', doctorId: i === 5 ? 'd2' : 'd1', date: '2026-06-17', time: `1${i}:00`, status: 'pending', source: 'phone', ...extra }) as Booking;

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T07:00:00Z'));
  loginAs('admin');
  vi.mocked(bookingsApi.list).mockResolvedValue(
    paginated([mk(1), mk(2), mk(3), mk(4, { status: 'cancelled' }), mk(5)]),
  );
  vi.mocked(patientsApi.list).mockResolvedValue(paginated([{ id: 'p1', firstName: 'Ali', lastName: 'Valiyev' }] as Patient[]));
  vi.mocked(doctorsApi.list).mockResolvedValue(
    paginated([
      { id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' },
      { id: 'd2', firstName: 'Bobur', lastName: 'Aliyev', specialty: 'T', phone: '' },
    ] as Doctor[]),
  );
});

afterEach(() => vi.useRealTimers());

describe('isPastCalendarDate', () => {
  it('blocks days before today only', () => {
    expect(isPastCalendarDate('2026-06-16', '2026-06-17')).toBe(true);
    expect(isPastCalendarDate('2026-06-17', '2026-06-17')).toBe(false);
    expect(isPastCalendarDate('2026-06-18', '2026-06-17')).toBe(false);
  });
});

describe('DraggableBookingCalendar', () => {
  it('"+N ta" opens the full list of the day and a row opens the booking', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <DraggableBookingCalendar />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: '+2 ta' }));
    expect(await screen.findByText('2026-06-17 — qabullar')).toBeInTheDocument();
    expect(screen.getAllByText(/Ali Valiyev/)).toHaveLength(5);
    fireEvent.click(screen.getByText(/14:00/));
    expect(await screen.findByText('Qabul tafsilotlari')).toBeInTheDocument();
  });
});
