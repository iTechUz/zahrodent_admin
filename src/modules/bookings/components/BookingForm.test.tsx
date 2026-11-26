import { PAST_BOOKING_DATE_ERROR, findPatientMatch, needsCancelReason, pastBookingDateError } from './BookingForm';
import { makeBookingFormSchema } from '@/shared/lib/validation';

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

describe('findPatientMatch', () => {
  const patients = [
    { id: 'p1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901112233' },
    { id: 'p2', firstName: 'Vali', lastName: 'Valiyev', phone: '+998901112233' },
  ];
  it('matches the same phone and name (case/space-insensitive)', () => {
    expect(findPatientMatch(patients, { firstName: ' ali ', lastName: 'VALIYEV', phone: '+998 90 111 22 33' })?.id).toBe('p1');
  });
  it('siblings sharing a phone are told apart by name; unknown name = no match', () => {
    expect(findPatientMatch(patients, { firstName: 'Vali', lastName: 'Valiyev', phone: '+998901112233' })?.id).toBe('p2');
    expect(findPatientMatch(patients, { firstName: 'Hasan', lastName: 'Valiyev', phone: '+998901112233' })).toBeUndefined();
    expect(findPatientMatch(patients, { firstName: 'Ali', lastName: 'Valiyev', phone: '+998909999999' })).toBeUndefined();
  });
});

describe('makeBookingFormSchema', () => {
  const base = { doctorId: 'd1', date: '2026-07-01', time: '10:00', source: 'walk-in', status: 'pending' } as const;
  it('create: Familiya, Ism, Telefon and Shifokor are required', () => {
    const r = makeBookingFormSchema(false).safeParse({ ...base, doctorId: '' });
    expect(r.success).toBe(false);
    const paths = !r.success ? r.error.issues.map((i) => i.path[0]) : [];
    expect(paths).toEqual(expect.arrayContaining(['doctorId', 'lastName', 'firstName', 'phone']));
    expect(makeBookingFormSchema(false).safeParse({ ...base, lastName: 'V', firstName: 'A', phone: '+998901112233' }).success).toBe(true);
  });
  it('create: a malformed phone is rejected', () => {
    expect(makeBookingFormSchema(false).safeParse({ ...base, lastName: 'V', firstName: 'A', phone: '+99890' }).success).toBe(false);
  });
  it('edit: the patient is required instead', () => {
    expect(makeBookingFormSchema(true).safeParse(base).success).toBe(false);
    expect(makeBookingFormSchema(true).safeParse({ ...base, patientId: 'p1' }).success).toBe(true);
  });
});
