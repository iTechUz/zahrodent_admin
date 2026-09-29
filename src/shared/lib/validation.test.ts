import { describe, expect, it } from 'vitest';
import {
  BookingSchema,
  DoctorSchema,
  PatientSchema,
  PaymentSchema,
  ServiceSchema,
  VisitSchema,
  phoneSchema,
  positiveNumber,
  requiredString,
} from './validation';

const firstError = (r: { success: boolean; error?: { errors: { message: string }[] } }) =>
  r.success ? null : r.error!.errors[0].message;

describe('phoneSchema', () => {
  it.each(['+998 90 123 4567', '998901234567', '+998-90-123-45-67', '0123456789', '+12345678901234567890'])(
    'accepts %s',
    (v) => expect(phoneSchema.safeParse(v).success).toBe(true),
  );

  it.each([
    ['too short', '+998 90 12'],
    ['too long (21 chars after +)', '1'.repeat(21)],
    ['letters', '+998 90 abc 4567'],
    ['double plus', '++998901234567'],
    ['plus in the middle', '998+901234567'],
    ['empty', ''],
    ['parentheses', '+998 (90) 1234567'],
  ])('rejects %s', (_label, v) => {
    const r = phoneSchema.safeParse(v);
    expect(r.success).toBe(false);
    expect(firstError(r)).toBe("Noto'g'ri telefon raqami");
  });

  it('rejects non-string input', () => {
    expect(phoneSchema.safeParse(998901234567).success).toBe(false);
  });

  // BUG: the character class allows a "phone" made only of separators, because no digit is required.
  // validation.ts:3 — `/^\+?[\d\s-]{10,20}$/` accepts "----------" and 10 spaces.
  it.todo('rejects phone numbers without any digits (e.g. "----------") — currently accepted');
});

describe('requiredString', () => {
  const schema = requiredString('Ism');
  it('accepts a non-empty string', () => expect(schema.safeParse('A').success).toBe(true));
  it('rejects an empty string with a named message', () => {
    expect(firstError(schema.safeParse(''))).toBe('Ism kiritilishi shart');
  });
  it('accepts whitespace-only (no trim)', () => expect(schema.safeParse('  ').success).toBe(true));
  it('rejects undefined', () => expect(schema.safeParse(undefined).success).toBe(false));
});

describe('positiveNumber', () => {
  const schema = positiveNumber('Narxi');
  it.each([[1, 1], ['42', 42], ['0.5', 0.5], [1e9, 1e9]])('coerces %p to %p', (input, out) => {
    const r = schema.safeParse(input);
    expect(r.success).toBe(true);
    expect(r.success && r.data).toBe(out);
  });
  it.each([0, -1, '0', '', '-5', null])('rejects %p with the Uzbek message', (v) => {
    expect(firstError(schema.safeParse(v))).toBe("Narxi musbat son bo'lishi shart");
  });
  it('rejects non-numeric strings (NaN)', () => {
    expect(schema.safeParse('abc').success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });
  // BUG (UX): for non-numeric input Number() yields NaN and zod reports its default English
  // "Expected number, received nan" instead of an Uzbek message. validation.ts:5-8
  it.todo('reports an Uzbek message for non-numeric input — currently zod default English text');
});

describe('PatientSchema', () => {
  const valid = { firstName: 'Ali', lastName: 'Valiyev', phone: '+998 90 123 4567', age: '30' };

  it('parses a minimal valid patient and applies defaults/coercion', () => {
    const r = PatientSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.age).toBe(30);
      expect(r.data.source).toBe('walk-in');
    }
  });

  it('keeps optional fields', () => {
    const r = PatientSchema.parse({ ...valid, source: 'telegram', notes: 'n', allergies: 'a', bloodType: 'O+' });
    expect(r).toMatchObject({ source: 'telegram', notes: 'n', allergies: 'a', bloodType: 'O+' });
  });

  it.each([
    ['firstName', { firstName: '' }, 'Ism kiritilishi shart'],
    ['lastName', { lastName: '' }, 'Familiya kiritilishi shart'],
    ['phone', { phone: '123' }, "Noto'g'ri telefon raqami"],
    ['age', { age: '0' }, "Yosh musbat son bo'lishi shart"],
  ])('reports %s errors', (_f, patch, msg) => {
    expect(firstError(PatientSchema.safeParse({ ...valid, ...patch }))).toBe(msg);
  });

  it('rejects an unknown source', () => {
    expect(PatientSchema.safeParse({ ...valid, source: 'instagram' }).success).toBe(false);
  });

  it('reports the first failing field first (field order)', () => {
    expect(firstError(PatientSchema.safeParse({ firstName: '', lastName: '', phone: '', age: 0 }))).toBe(
      'Ism kiritilishi shart',
    );
  });
});

describe('BookingSchema', () => {
  const valid = {
    patientId: 'p1', doctorId: 'd1', date: '2024-04-01', time: '10:00', source: 'phone', status: 'pending',
  };
  it('accepts a valid booking', () => expect(BookingSchema.safeParse(valid).success).toBe(true));
  it.each(['pending', 'confirmed', 'arrived', 'no-show', 'completed', 'cancelled'])('accepts status %s', (status) =>
    expect(BookingSchema.safeParse({ ...valid, status }).success).toBe(true),
  );
  it.each([
    ['patientId', 'Bemor kiritilishi shart'],
    ['doctorId', 'Shifokor kiritilishi shart'],
    ['date', 'Sana kiritilishi shart'],
    ['time', 'Vaqt kiritilishi shart'],
  ])('requires %s', (field, msg) => {
    expect(firstError(BookingSchema.safeParse({ ...valid, [field]: '' }))).toBe(msg);
  });
  it('source has no default (required)', () => {
    const { source: _s, ...rest } = valid;
    expect(BookingSchema.safeParse(rest).success).toBe(false);
  });
  it('rejects unknown status', () => expect(BookingSchema.safeParse({ ...valid, status: 'done' }).success).toBe(false));
});

describe('ServiceSchema', () => {
  const valid = { name: 'Plomba', category: 'Davolash', price: '150000', duration: '40' };
  it('coerces price and duration', () => {
    expect(ServiceSchema.parse(valid)).toMatchObject({ price: 150000, duration: 40 });
  });
  it.each([
    [{ name: '' }, 'Xizmat nomi kiritilishi shart'],
    [{ category: '' }, 'Kategoriya kiritilishi shart'],
    [{ price: 0 }, "Narxi musbat son bo'lishi shart"],
    [{ duration: -10 }, "Davomiyligi musbat son bo'lishi shart"],
  ])('rejects %o', (patch, msg) => {
    expect(firstError(ServiceSchema.safeParse({ ...valid, ...patch }))).toBe(msg);
  });
});

describe('PaymentSchema', () => {
  const valid = { patientId: 'p1', amount: 1000, method: 'card', status: 'paid', description: 'abc' };
  it('accepts a valid payment', () => expect(PaymentSchema.safeParse(valid).success).toBe(true));
  it.each(['cash', 'card', 'transfer', 'insurance'])('accepts method %s', (method) =>
    expect(PaymentSchema.safeParse({ ...valid, method }).success).toBe(true),
  );
  it.each(['paid', 'partial', 'unpaid'])('accepts status %s', (status) =>
    expect(PaymentSchema.safeParse({ ...valid, status }).success).toBe(true),
  );
  it('requires description of at least 3 chars', () => {
    expect(firstError(PaymentSchema.safeParse({ ...valid, description: 'ab' }))).toBe(
      "Tavsif kamida 3 ta belgidan iborat bo'lishi kerak",
    );
  });
  it('rejects zero amount', () => {
    expect(firstError(PaymentSchema.safeParse({ ...valid, amount: 0 }))).toBe("Summa musbat son bo'lishi shart");
  });
  it('rejects unknown method', () => expect(PaymentSchema.safeParse({ ...valid, method: 'crypto' }).success).toBe(false));
  it('requires patient', () => {
    expect(firstError(PaymentSchema.safeParse({ ...valid, patientId: '' }))).toBe('Bemor kiritilishi shart');
  });
});

describe('DoctorSchema', () => {
  const valid = { name: 'Dr. X', specialty: 'Ortodontiya', phone: '+998 90 111 2233', workingHours: '9-17' };
  it('accepts a valid doctor', () => expect(DoctorSchema.safeParse(valid).success).toBe(true));
  it.each([
    [{ name: '' }, 'Ism familiya kiritilishi shart'],
    [{ specialty: '' }, 'Mutaxassislik kiritilishi shart'],
    [{ phone: 'x' }, "Noto'g'ri telefon raqami"],
    [{ workingHours: '' }, 'Ish vaqti kiritilishi shart'],
  ])('rejects %o', (patch, msg) => {
    expect(firstError(DoctorSchema.safeParse({ ...valid, ...patch }))).toBe(msg);
  });
});

describe('VisitSchema', () => {
  it.each(['not-started', 'in-progress', 'completed'])('accepts status %s', (status) =>
    expect(VisitSchema.safeParse({ patientId: 'p1', status }).success).toBe(true),
  );
  it('requires a patient', () => {
    expect(firstError(VisitSchema.safeParse({ patientId: '', status: 'completed' }))).toBe('Bemor kiritilishi shart');
  });
  it('rejects unknown status', () => {
    expect(VisitSchema.safeParse({ patientId: 'p1', status: 'paused' }).success).toBe(false);
  });
  it('keeps optional text fields', () => {
    expect(VisitSchema.parse({ patientId: 'p1', status: 'completed', diagnosis: 'd', treatment: 't', notes: 'n' }))
      .toMatchObject({ diagnosis: 'd', treatment: 't', notes: 'n' });
  });
});
