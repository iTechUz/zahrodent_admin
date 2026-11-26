import {
  bookingsInSlot,
  doctorWorksAt,
  isSlotPast,
  occupiesSlot,
  slotOf,
  slotTimes,
  weekDays,
  weekStart,
} from './calendar-grid';

describe('calendar grid helpers', () => {
  it('slotTimes: 30 min steps from 08:00 to 19:30', () => {
    const t = slotTimes();
    expect(t[0]).toBe('08:00');
    expect(t[1]).toBe('08:30');
    expect(t.at(-1)).toBe('19:30');
    expect(t).toHaveLength(24);
  });

  it('weekStart / weekDays run Monday to Sunday', () => {
    expect(weekStart('2026-11-26')).toBe('2026-11-23'); // Thursday -> Monday
    expect(weekStart('2026-11-29')).toBe('2026-11-23'); // Sunday
    expect(weekDays('2026-11-26')).toEqual([
      '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29',
    ]);
  });

  it('slotOf rounds down to the slot start', () => {
    expect(slotOf('09:45')).toBe('09:30');
    expect(slotOf('09:30:00')).toBe('09:30');
    expect(slotOf('10:00')).toBe('10:00');
  });

  it('isSlotPast: earlier days and already finished slots are past', () => {
    expect(isSlotPast('2026-11-25', '12:00', '2026-11-26', '09:00')).toBe(true);
    expect(isSlotPast('2026-11-27', '08:00', '2026-11-26', '23:00')).toBe(false);
    expect(isSlotPast('2026-11-26', '09:00', '2026-11-26', '09:10')).toBe(false); // slot 09:00–09:30 still running
    expect(isSlotPast('2026-11-26', '09:00', '2026-11-26', '09:30')).toBe(true);
  });

  it('doctorWorksAt follows schedule and days off; no working day = unrestricted', () => {
    const doc = {
      schedule: [{ day: 3, startTime: '09:00', endTime: '13:00', isWorking: true }],
      daysOff: ['2026-12-03'],
    };
    expect(doctorWorksAt(doc, '2026-11-26', '09:00')).toBe(true); // Thursday = 3
    expect(doctorWorksAt(doc, '2026-11-26', '13:00')).toBe(false); // end is exclusive
    expect(doctorWorksAt(doc, '2026-11-27', '10:00')).toBe(false); // Friday not working
    expect(doctorWorksAt(doc, '2026-12-03', '10:00')).toBe(false); // day off
    expect(doctorWorksAt({ schedule: [], daysOff: [] }, '2026-11-27', '10:00')).toBe(true);
    expect(doctorWorksAt(undefined, '2026-11-27', '10:00')).toBe(true);
  });

  it('bookingsInSlot filters by date, slot and doctor, sorted by time', () => {
    const b = (id: string, date: string, time: string, doctorId: string) => ({ id, date, time, doctorId }) as never;
    const list = [b('1', '2026-11-26', '09:40', 'd1'), b('2', '2026-11-26', '09:10', 'd1'), b('3', '2026-11-26', '09:10', 'd2'), b('4', '2026-11-27', '09:10', 'd1')];
    expect(bookingsInSlot(list, '2026-11-26', '09:00', 'd1').map((x) => (x as { id: string }).id)).toEqual(['2']);
    expect(bookingsInSlot(list, '2026-11-26', '09:30').map((x) => (x as { id: string }).id)).toEqual(['1']);
    expect(bookingsInSlot(list, '2026-11-26', '09:00').map((x) => (x as { id: string }).id)).toEqual(['2', '3']);
  });

  it('occupiesSlot: cancelled and no-show free the slot', () => {
    expect(occupiesSlot({ status: 'pending' })).toBe(true);
    expect(occupiesSlot({ status: 'cancelled' })).toBe(false);
    expect(occupiesSlot({ status: 'no-show' })).toBe(false);
  });
});
