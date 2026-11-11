import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { bookingsApi, patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient } from '@/shared/types';
import {
  BookingDetails,
  BookingForm,
  PAST_BOOKING_DATE_ERROR,
  latestCancelReason,
  needsCancelReason,
  pastBookingDateError,
} from './BookingForm';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

describe('pastBookingDateError', () => {
  it('rejects a new booking before today (backend returns 400)', () => {
    expect(pastBookingDateError('2026-06-16', false, '2026-06-17')).toBe(PAST_BOOKING_DATE_ERROR);
  });

  it('allows today and future dates', () => {
    expect(pastBookingDateError('2026-06-17', false, '2026-06-17')).toBeNull();
    expect(pastBookingDateError('2026-07-01', false, '2026-06-17')).toBeNull();
  });

  it('editing an existing (past) booking is allowed', () => {
    expect(pastBookingDateError('2026-01-01', true, '2026-06-17')).toBeNull();
  });

  it('defaults "today" to the Tashkent date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-16T19:30:00Z')); // 00:30 on 06-17 in Tashkent
    expect(pastBookingDateError('2026-06-16', false)).toBe(PAST_BOOKING_DATE_ERROR);
    expect(pastBookingDateError('2026-06-17', false)).toBeNull();
    vi.useRealTimers();
  });
});

describe('needsCancelReason', () => {
  it('asks for a reason only when an existing booking is switched to cancelled', () => {
    expect(needsCancelReason({ status: 'pending' }, 'cancelled')).toBe(true);
    expect(needsCancelReason({ status: 'cancelled' }, 'cancelled')).toBe(false);
    expect(needsCancelReason({ status: 'pending' }, 'confirmed')).toBe(false);
    expect(needsCancelReason(null, 'cancelled')).toBe(false);
  });
});

describe('latestCancelReason', () => {
  it('takes the reason of the most recent cancellation', () => {
    expect(
      latestCancelReason([
        { toStatus: 'cancelled', reason: 'eski', createdAt: '2026-06-01T10:00:00Z' },
        { toStatus: 'pending', reason: null, createdAt: '2026-06-02T10:00:00Z' },
        { toStatus: 'cancelled', reason: 'yangi', createdAt: '2026-06-03T10:00:00Z' },
      ]),
    ).toBe('yangi');
    expect(latestCancelReason([])).toBeNull();
    expect(latestCancelReason(undefined)).toBeNull();
  });
});

describe('BookingForm (component)', () => {
  const doctor = {
    id: 'd1',
    firstName: 'Aziz',
    lastName: 'Karimov',
    specialty: 'T',
    phone: '',
    // Wednesday (2026-06-17 = index 2) 09:00-18:00 with a lunch break, everything else rest days
    schedule: [{ day: 2, startTime: '09:00', endTime: '18:00', isWorking: true, breakStart: '13:00', breakEnd: '14:00' }],
    daysOff: ['2026-06-24'],
  } as Doctor;

  function renderForm(props: Partial<React.ComponentProps<typeof BookingForm>> = {}) {
    const onSave = vi.fn();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={createTestQueryClient()}>
          <BookingForm open onOpenChange={() => {}} editing={null} doctors={[doctor]} services={[]} onSave={onSave} {...props} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    return { onSave };
  }

  beforeEach(() => {
    resetApiMock();
    vi.clearAllMocks();
    loginAs('receptionist');
  });

  const existing = {
    id: 'b1', patientId: 'p1', patient: { firstName: 'Ali', lastName: 'Valiyev' }, doctorId: 'd1',
    date: '2026-06-17', time: '10:00', source: 'phone', status: 'pending', createdAt: '', notes: 'Izoh',
  } as Booking;

  it('editing: shows the doctor working hours + break and the busy ranges of that day (excluding itself)', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(
      paginated([
        existing,
        { ...existing, id: 'b2', time: '11:00', patient: { firstName: 'Vali', lastName: 'K' } },
      ]),
    );
    renderForm({ editing: existing });
    const hint = await screen.findByTestId('doctor-hint');
    await waitFor(() => expect(hint).toHaveTextContent('Ish vaqti: 09:00–18:00 • Tanaffus: 13:00–14:00'));
    await waitFor(() => expect(hint).toHaveTextContent('Band vaqtlar: 11:00'));
    expect(hint).not.toHaveTextContent('10:00');
    expect(bookingsApi.list).toHaveBeenCalledWith({ doctorId: 'd1', startDate: '2026-06-17', endDate: '2026-06-17', limit: 100 });
  });

  it('warns about a day off and about the chosen time being in the lunch break', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([]));
    renderForm({ editing: { ...existing, date: '2026-06-24' } });
    expect(await screen.findByText(/Shifokorning dam olish kuni/)).toBeInTheDocument();
  });

  it('shows the break warning when the time is inside the break', async () => {
    vi.mocked(bookingsApi.list).mockResolvedValue(paginated([]));
    renderForm({ editing: { ...existing, time: '13:30' } });
    expect(await screen.findByText(/tanaffusiga to'g'ri keladi/)).toBeInTheDocument();
  });

  it('"Yangi bemor" quick-create posts the patient and selects it in the form', async () => {
    vi.mocked(patientsApi.create).mockResolvedValue({ id: 'pNew', firstName: 'Yangi', lastName: 'Bemor', phone: '+998901234567' } as Patient);
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Yangi bemor/ }));
    fireEvent.change(screen.getByLabelText('Ism familya'), { target: { value: 'Yangi Bemor' } });
    fireEvent.change(screen.getByLabelText("Tug'ilgan yili"), { target: { value: '1990' } });
    fireEvent.change(screen.getByLabelText('Ish joyi'), { target: { value: 'IT' } });
    // invalid phone first → inline error, no request
    fireEvent.click(screen.getByRole('button', { name: "Bemorni qo'shish" }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(patientsApi.create).not.toHaveBeenCalled();
    fireEvent.input(screen.getByLabelText('Telefon'), { target: { value: '+998 90 123 45 67' } });
    fireEvent.click(screen.getByRole('button', { name: "Bemorni qo'shish" }));
    await waitFor(() => expect(patientsApi.create).toHaveBeenCalledTimes(1));
    expect(patientsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Yangi', lastName: 'Bemor', phone: '+998901234567', workplace: 'IT', source: 'walk-in', age: new Date().getFullYear() - 1990 }),
    );
    // the quick form closes and the new patient is the selected one
    await waitFor(() => expect(screen.queryByLabelText('Ism familya')).toBeNull());
    await waitFor(() => expect(screen.getAllByRole('combobox').some((c) => /Yangi Bemor/.test(c.textContent ?? ''))).toBe(true));
    expect(patientsApi.get).not.toHaveBeenCalled();
  });

  it('no quick-create for roles that cannot create patients', () => {
    loginAs('doctor');
    renderForm();
    expect(screen.queryByRole('button', { name: /Yangi bemor/ })).toBeNull();
  });
});

describe('BookingDetails', () => {
  it('links the patient, shows notes, formatted date, phone and the cancel reason', async () => {
    resetApiMock();
    vi.mocked(patientsApi.get).mockResolvedValue({ id: 'p1', phone: '+998901112233' } as Patient);
    vi.mocked(bookingsApi.statusLog).mockResolvedValue([
      { id: 'l1', bookingId: 'b1', fromStatus: 'pending', toStatus: 'cancelled', reason: 'Bemor kela olmaydi', changedByName: 'A', createdAt: '2026-06-02T10:00:00Z' },
    ]);
    const booking = {
      id: 'b1', patientId: 'p1', patient: { firstName: 'Ali', lastName: 'Valiyev' }, doctorId: 'd1',
      date: '2026-06-17', time: '10:00', source: 'phone', status: 'cancelled', createdAt: '', notes: 'Og\'riq bor',
    } as Booking;
    const onEdit = vi.fn();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={createTestQueryClient()}>
          <BookingDetails booking={booking} onClose={() => {}} doctors={[]} onEdit={onEdit} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Ali Valiyev' })).toHaveAttribute('href', '/patients/p1');
    expect(screen.getByText("Og'riq bor")).toBeInTheDocument();
    expect(screen.queryByText(/2026-06-17/)).toBeNull();
    expect(await screen.findByText('Bemor kela olmaydi')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '+998901112233' })).toHaveAttribute('href', 'tel:+998901112233');
    fireEvent.click(screen.getByRole('button', { name: 'Tahrirlash' }));
    expect(onEdit).toHaveBeenCalledWith(booking);
  });
});
