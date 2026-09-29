// BookingCalendar is not rendered in unit tests yet; the known defect is recorded here.
describe('BookingCalendar', () => {
  it.todo(
    'BUG: src/components/BookingCalendar.tsx:188 — booking details show `doctor?.name`, which does not exist on Doctor ' +
      '(firstName/lastName), so the "Shifokor" row is always blank',
  );
});
