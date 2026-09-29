import {
  BOOKING_SOURCES,
  BOOKING_SOURCE_LABELS,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  VISIT_STATUSES,
  VISIT_STATUS_LABELS,
} from './index';

describe('shared constants', () => {
  it('match the backend enums', () => {
    expect(BOOKING_SOURCES).toEqual(['walk-in', 'telegram', 'website', 'phone']);
    expect(BOOKING_STATUSES).toEqual(['pending', 'confirmed', 'arrived', 'no-show', 'completed', 'cancelled']);
    expect(PAYMENT_STATUSES).toEqual(['paid', 'partial', 'unpaid']);
    expect(PAYMENT_METHODS).toEqual(['cash', 'card', 'transfer', 'insurance']);
    expect(VISIT_STATUSES).toEqual(['not-started', 'in-progress', 'completed']);
  });

  it.each([
    ['BOOKING_SOURCE', BOOKING_SOURCES, BOOKING_SOURCE_LABELS],
    ['BOOKING_STATUS', BOOKING_STATUSES, BOOKING_STATUS_LABELS],
    ['PAYMENT_STATUS', PAYMENT_STATUSES, PAYMENT_STATUS_LABELS],
    ['PAYMENT_METHOD', PAYMENT_METHODS, PAYMENT_METHOD_LABELS],
    ['VISIT_STATUS', VISIT_STATUSES, VISIT_STATUS_LABELS],
  ] as const)('%s has a non-empty label for every value', (_name, values, labels) => {
    expect(Object.keys(labels).sort()).toEqual([...values].sort());
    for (const v of values) expect((labels as Record<string, string>)[v]).toBeTruthy();
  });
});
