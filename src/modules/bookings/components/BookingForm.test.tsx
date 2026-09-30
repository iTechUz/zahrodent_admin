import { PAST_BOOKING_DATE_ERROR, pastBookingDateError } from './BookingForm';

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
