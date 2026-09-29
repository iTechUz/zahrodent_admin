import {
  BookingSchema,
  DoctorSchema,
  PatientCommentSchema,
  PatientSchema,
  PaymentSchema,
  ServiceSchema,
  VisitSchema,
  phoneSchema,
  positiveNumber,
  requiredString,
} from './validation';
import { defaultDoctorSchedule } from './doctor-schedule';

const firstError = (r: { success: boolean; error?: { errors: { message: string }[] } }) =>
  r.success ? null : r.error!.errors[0].message;

describe('phoneSchema', () => {
  it.each(['+998901234567', '+998331112233'])('accepts %s', (p) => {
    expect(phoneSchema.safeParse(p).success).toBe(true);
  });

  it.each(['998901234567', '+99890123456', '+9989012345678', '+998 90 123 45 67', '+7901234567', ''])(
    'rejects %p with the Uzbek message',
    (p) => {
      expect(firstError(phoneSchema.safeParse(p))).toBe("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
    },
  );
});

describe('requiredString / positiveNumber', () => {
  it('requiredString uses the field name in the message', () => {
    expect(firstError(requiredString('Ism').safeParse(''))).toBe('Ism kiritilishi shart');
    expect(requiredString('Ism').safeParse('a').success).toBe(true);
  });

  it('positiveNumber coerces numeric strings (money/number inputs)', () => {
    const s = positiveNumber('Summa');
    expect(s.parse('300000')).toBe(300000);
    expect(s.parse(5)).toBe(5);
  });

  it.each([0, -1, '0', 'abc', ''])('positiveNumber rejects %p', (v) => {
    const r = positiveNumber('Summa').safeParse(v);
    expect(r.success).toBe(false);
  });

  it('positiveNumber reports the Uzbek message for non-positive numbers', () => {
    expect(firstError(positiveNumber('Summa').safeParse(0))).toBe("Summa musbat son bo'lishi shart");
  });
});

describe('PatientSchema', () => {
  const ok = {
    firstName: 'Ali',
    lastName: 'Valiyev',
    phone: '+998901112233',
    age: '30',
    address: 'Toshkent',
    workplace: 'IT',
  };

  it('parses a valid patient, coercing age and defaulting source to walk-in', () => {
    const r = PatientSchema.parse(ok);
    expect(r.age).toBe(30);
    expect(r.source).toBe('walk-in');
  });

  it('requires first/last name, address, workplace', () => {
    const r = PatientSchema.safeParse({ ...ok, firstName: '' });
    expect(firstError(r)).toBe('Ism kiritilishi shart');
    expect(firstError(PatientSchema.safeParse({ ...ok, address: '' }))).toBe('Manzil kiritilishi shart');
    expect(firstError(PatientSchema.safeParse({ ...ok, workplace: '' }))).toBe('Ish joyi kiritilishi shart');
  });

  it('rejects unknown sources', () => {
    expect(PatientSchema.safeParse({ ...ok, source: 'instagram' }).success).toBe(false);
  });
});

describe('BookingSchema', () => {
  const ok = {
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-06-10',
    time: '10:00',
    source: 'phone',
    status: 'pending',
  };

  it('accepts a valid booking with empty serviceId', () => {
    expect(BookingSchema.safeParse({ ...ok, serviceId: '' }).success).toBe(true);
  });

  it('requires patient / doctor / date / time', () => {
    expect(firstError(BookingSchema.safeParse({ ...ok, patientId: '' }))).toBe('Bemor kiritilishi shart');
    expect(firstError(BookingSchema.safeParse({ ...ok, doctorId: '' }))).toBe('Shifokor kiritilishi shart');
    expect(firstError(BookingSchema.safeParse({ ...ok, date: '' }))).toBe('Sana kiritilishi shart');
    expect(firstError(BookingSchema.safeParse({ ...ok, time: '' }))).toBe('Vaqt kiritilishi shart');
  });

  it('rejects statuses the backend does not know', () => {
    expect(BookingSchema.safeParse({ ...ok, status: 'done' }).success).toBe(false);
  });
});

describe('ServiceSchema', () => {
  it('coerces price/duration and requires them to be positive', () => {
    expect(ServiceSchema.parse({ name: 'P', category: 'Davolash', price: '1000', duration: '30' })).toMatchObject({
      price: 1000,
      duration: 30,
    });
    expect(firstError(ServiceSchema.safeParse({ name: 'P', category: 'D', price: 0, duration: 30 }))).toBe(
      "Narxi musbat son bo'lishi shart",
    );
  });
});

describe('PaymentSchema', () => {
  const ok = { patientId: 'p1', amount: '100000', method: 'cash', status: 'paid', description: 'Plomba' };

  it('defaults type to INCOME and coerces amount', () => {
    expect(PaymentSchema.parse(ok)).toMatchObject({ amount: 100000, type: 'INCOME' });
  });

  it('accepts EXPENSE', () => {
    expect(PaymentSchema.parse({ ...ok, type: 'EXPENSE' }).type).toBe('EXPENSE');
  });

  it('requires a description of at least 3 chars (backend MinLength(3))', () => {
    expect(firstError(PaymentSchema.safeParse({ ...ok, description: 'ab' }))).toBe(
      "Tavsif kamida 3 ta belgidan iborat bo'lishi kerak",
    );
  });

  it('rejects unknown method / status', () => {
    expect(PaymentSchema.safeParse({ ...ok, method: 'crypto' }).success).toBe(false);
    expect(PaymentSchema.safeParse({ ...ok, status: 'refunded' }).success).toBe(false);
  });
});

describe('DoctorSchema', () => {
  const ok = {
    firstName: 'Aziz',
    lastName: 'K',
    specialty: 'Terapevt',
    phone: '+998901112233',
    schedule: defaultDoctorSchedule(),
  };

  it('accepts no password, an empty password, or >= 6 chars', () => {
    expect(DoctorSchema.safeParse(ok).success).toBe(true);
    expect(DoctorSchema.safeParse({ ...ok, password: '' }).success).toBe(true);
    expect(DoctorSchema.safeParse({ ...ok, password: 'secret' }).success).toBe(true);
  });

  it('rejects a short password', () => {
    expect(firstError(DoctorSchema.safeParse({ ...ok, password: '123' }))).toBe('Kamida 6 ta belgi');
  });

  it('requires exactly 7 schedule slots', () => {
    expect(DoctorSchema.safeParse({ ...ok, schedule: ok.schedule.slice(0, 6) }).success).toBe(false);
  });

  it('requires start/end time on working days (path points at startTime)', () => {
    const schedule = defaultDoctorSchedule();
    schedule[2] = { day: 2, startTime: ' ', endTime: '17:00', isWorking: true };
    const r = DoctorSchema.safeParse({ ...ok, schedule });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.errors[0].message).toBe('Ish kunlari uchun boshlanish va tugash vaqtini kiriting');
      expect(r.error.errors[0].path).toEqual(['schedule', 2, 'startTime']);
    }
  });

  it('does not require times on non-working days', () => {
    const schedule = defaultDoctorSchedule();
    schedule[4] = { day: 4, startTime: '', endTime: '', isWorking: false };
    expect(DoctorSchema.safeParse({ ...ok, schedule }).success).toBe(true);
  });
});

describe('VisitSchema / PatientCommentSchema', () => {
  it('VisitSchema requires patient and a known status', () => {
    expect(VisitSchema.safeParse({ patientId: 'p1', status: 'completed' }).success).toBe(true);
    expect(firstError(VisitSchema.safeParse({ patientId: '', status: 'completed' }))).toBe('Bemor kiritilishi shart');
    expect(VisitSchema.safeParse({ patientId: 'p1', status: 'done' }).success).toBe(false);
  });

  it('PatientCommentSchema requires content', () => {
    expect(firstError(PatientCommentSchema.safeParse({ content: '', patientId: 'p1' }))).toBe('Izoh kiritilishi shart');
  });
});
