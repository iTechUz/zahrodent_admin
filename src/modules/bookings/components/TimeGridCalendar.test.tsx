import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient } from '@/shared/types';
import { TimeGridCalendar } from './TimeGridCalendar';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const doctors = [
  { id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' },
  { id: 'd2', firstName: 'Bobur', lastName: 'Aliyev', specialty: 'T', phone: '' },
] as Doctor[];

const booking = { id: 'b1', patientId: 'p1', doctorId: 'd1', date: '2026-06-17', time: '10:15', status: 'pending', source: 'phone' } as Booking;

const renderCalendar = (mode: 'day' | 'week', onSlotClick = vi.fn(), onBookingClick = vi.fn()) => {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <TimeGridCalendar mode={mode} onSlotClick={onSlotClick} onBookingClick={onBookingClick} />
    </QueryClientProvider>,
  );
  return { onSlotClick, onBookingClick };
};

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T03:00:00Z')); // 08:00 in Tashkent
  loginAs('admin');
  vi.mocked(bookingsApi.list).mockResolvedValue(paginated([booking]));
  vi.mocked(patientsApi.list).mockResolvedValue(paginated([{ id: 'p1', firstName: 'Ali', lastName: 'Valiyev' }] as Patient[]));
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated(doctors));
});
afterEach(() => vi.useRealTimers());

describe('TimeGridCalendar', () => {
  it('day view: one column per doctor, booking sits in its time slot', async () => {
    renderCalendar('day');
    expect(await screen.findByText('Aziz Karimov')).toBeInTheDocument();
    expect(screen.getByText('Bobur Aliyev')).toBeInTheDocument();
    expect(await screen.findByText(/10:15 Ali/)).toBeInTheDocument();
  });

  it('clicking a free slot prefills date, time and the column doctor', async () => {
    const { onSlotClick } = renderCalendar('day');
    await screen.findByText('Bobur Aliyev');
    fireEvent.click(screen.getAllByLabelText("Bo'sh vaqt 2026-06-17 11:00")[1]);
    expect(onSlotClick).toHaveBeenCalledWith({ date: '2026-06-17', time: '11:00', doctorId: 'd2' });
  });

  it('an occupied slot is not bookable but its booking opens', async () => {
    const { onSlotClick, onBookingClick } = renderCalendar('day');
    const chip = await screen.findByText(/10:15 Ali/);
    // d1 is busy at 10:00; only the other doctor's 10:00 cell is free
    expect(screen.getAllByLabelText("Bo'sh vaqt 2026-06-17 10:00")).toHaveLength(1);
    fireEvent.click(chip);
    expect(onBookingClick).toHaveBeenCalledWith(booking);
    expect(onSlotClick).not.toHaveBeenCalled();
  });

  it('week view: 7 day columns, past slots are not bookable', async () => {
    const { onSlotClick } = renderCalendar('week');
    expect(await screen.findByText('Du')).toBeInTheDocument();
    expect(screen.getByText('Ya')).toBeInTheDocument();
    // Monday 15th is before "today" (Wednesday 17th)
    expect(screen.queryByLabelText("Bo'sh vaqt 2026-06-15 09:00")).toBeNull();
    fireEvent.click(await screen.findByLabelText("Bo'sh vaqt 2026-06-18 09:00"));
    expect(onSlotClick).toHaveBeenCalledWith({ date: '2026-06-18', time: '09:00', doctorId: undefined });
  });

  it('roles that cannot create bookings get no clickable slots', async () => {
    loginAs('doctor');
    renderCalendar('day');
    await screen.findByText(/10:15 Ali/);
    expect(screen.queryAllByLabelText(/Bo'sh vaqt/)).toHaveLength(0);
  });
});
