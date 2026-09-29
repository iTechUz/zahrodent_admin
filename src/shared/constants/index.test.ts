import { describe, expect, it } from 'vitest';
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
import { BookingSchema, PaymentSchema, VisitSchema } from '@/shared/lib/validation';

const pairs: [string, readonly string[], Record<string, string>][] = [
  ['booking sources', BOOKING_SOURCES, BOOKING_SOURCE_LABELS],
  ['booking statuses', BOOKING_STATUSES, BOOKING_STATUS_LABELS],
  ['payment statuses', PAYMENT_STATUSES, PAYMENT_STATUS_LABELS],
  ['payment methods', PAYMENT_METHODS, PAYMENT_METHOD_LABELS],
  ['visit statuses', VISIT_STATUSES, VISIT_STATUS_LABELS],
];

describe('shared constants', () => {
  it.each(pairs)('%s: every value has a non-empty label and no extra labels', (_n, list, labels) => {
    expect(Object.keys(labels).sort()).toEqual([...list].sort());
    list.forEach((k) => expect(labels[k]).toBeTruthy());
    expect(new Set(list).size).toBe(list.length);
  });

  it('lists match the zod enums used by the forms', () => {
    expect(BookingSchema.shape.source.options).toEqual(BOOKING_SOURCES);
    expect(BookingSchema.shape.status.options).toEqual(BOOKING_STATUSES);
    expect(PaymentSchema.shape.method.options).toEqual(PAYMENT_METHODS);
    expect(PaymentSchema.shape.status.options).toEqual(PAYMENT_STATUSES);
    expect(VisitSchema.shape.status.options).toEqual(VISIT_STATUSES);
  });
});
