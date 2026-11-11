import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { bookingsApi, doctorsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor } from '@/shared/types';
import { DraggableBookingCalendar, isMovableBooking, isPastCalendarDate, planCalendarMove } from './DraggableBookingCalendar';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const mk = (i: number, extra: Partial<Booking> = {}) =>
  ({ id: `b${i}`, patientId: 'p1', patient: { firstName: 'Ali', lastName: 'Valiyev' }, doctorId: i === 5 ? 'd2' : 'd1', date: '2026-06-17', time: `1${i}:00`, status: 'pending', source: 'phone', ...extra }) as Booking;

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-17T07:00:00Z'));
  loginAs('admin');
  vi.mocked(bookingsApi.list).mockResolvedValue(
    paginated([mk(1), mk(2), mk(3), mk(4, { status: 'cancelled' }), mk(5)]),
  );
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={createTestQueryClient()}>
          <DraggableBookingCalendar />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: '+2 ta' }));
    expect(await screen.findByText(/17.06.2026 — qabullar/)).toBeInTheDocument();
    expect(screen.getAllByText(/Ali Valiyev/)).toHaveLength(5);
    fireEvent.click(screen.getByText(/14:00/));
    expect(await screen.findByText('Qabul tafsilotlari')).toBeInTheDocument();
  });
});

describe('isMovableBooking', () => {
  it('cancelled and completed bookings are history and cannot be dragged', () => {
    expect(isMovableBooking('cancelled')).toBe(false);
    expect(isMovableBooking('completed')).toBe(false);
    for (const s of ['pending', 'confirmed', 'arrived', 'no-show'] as const) expect(isMovableBooking(s)).toBe(true);
  });
});

function renderCal(props: Partial<React.ComponentProps<typeof DraggableBookingCalendar>> = {}) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={createTestQueryClient()}>
        <DraggableBookingCalendar {...props} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('DraggableBookingCalendar (behaviour)', () => {
  beforeAll(() => {
    // Radix Select scrolls the active option into view; jsdom has no layout
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  });

  it('starts on the clinic month and loads only the visible grid', async () => {
    renderCal();
    await screen.findAllByText(/Ali/);
    expect(screen.getByText('Iyun 2026')).toBeInTheDocument();
    expect(bookingsApi.list).toHaveBeenCalledWith({ startDate: '2026-06-01', endDate: '2026-07-12', page: 0, limit: 100 });
  });

  it('only movable bookings get a drag handle, and it is visible without hover (touch)', async () => {
    renderCal();
    await screen.findAllByText(/Ali/);
    // 3 chips are visible in the cell: b1, b2, b3 (all pending) → 3 handles; the cancelled one is in "+N"
    const handles = screen.getAllByRole('button', { name: "Qabulni boshqa kunga ko'chirish" });
    expect(handles).toHaveLength(3);
    for (const h of handles) {
      expect(h.className).toContain('opacity-60');
      expect(h.className).toContain('[@media(hover:none)]:opacity-60');
    }
  });

  it('the doctor filter is sent to the server instead of filtering client-side', async () => {
    renderCal();
    await screen.findAllByText(/Ali/);
    fireEvent.click(screen.getByRole('combobox', { name: 'Shifokor' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Bobur Aliyev' }));
    await waitFor(() =>
      expect(bookingsApi.list).toHaveBeenCalledWith({ startDate: '2026-06-01', endDate: '2026-07-12', doctorId: 'd2', page: 0, limit: 100 }),
    );
  });

  it('the detail popup shows a formatted date, links the patient and offers "Tahrirlash"', async () => {
    const onEdit = vi.fn();
    renderCal({ onEdit });
    fireEvent.click((await screen.findAllByText(/Ali/))[0]);
    expect(await screen.findByText('Qabul tafsilotlari')).toBeInTheDocument();
    expect(screen.getByText(/17.06.2026 — 1\d:00/)).toBeInTheDocument();
    expect(screen.queryByText(/2026-06-17 —/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Ali Valiyev' })).toHaveAttribute('href', '/patients/p1');
    fireEvent.click(screen.getByRole('button', { name: 'Tahrirlash' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'p1' }));
  });
});

describe('planCalendarMove', () => {
  const ctx = { canReschedule: true, today: '2026-06-17' };
  it('a normal drop to a future day waits for confirmation (nothing persists straight away)', () => {
    expect(planCalendarMove({ date: '2026-06-18', status: 'pending' }, '2026-06-20', ctx)).toBe('confirm');
  });
  it('ignores same-day drops, missing permission, cancelled and completed bookings', () => {
    expect(planCalendarMove({ date: '2026-06-18', status: 'pending' }, '2026-06-18', ctx)).toBe('ignore');
    expect(planCalendarMove({ date: '2026-06-18', status: 'pending' }, '2026-06-20', { ...ctx, canReschedule: false })).toBe('ignore');
    expect(planCalendarMove({ date: '2026-06-18', status: 'cancelled' }, '2026-06-20', ctx)).toBe('ignore');
    expect(planCalendarMove({ date: '2026-06-18', status: 'completed' }, '2026-06-20', ctx)).toBe('ignore');
    expect(planCalendarMove(undefined, '2026-06-20', ctx)).toBe('ignore');
  });
  it('past days are rejected with an error', () => {
    expect(planCalendarMove({ date: '2026-06-18', status: 'pending' }, '2026-06-10', ctx)).toBe('past');
  });
});
