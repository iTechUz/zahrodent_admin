import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\+?[\d\s-]{10,20}$/, "Noto'g'ri telefon raqami");
export const requiredString = (name: string) => z.string().min(1, `${name} kiritilishi shart`);
export const positiveNumber = (name: string) => z.preprocess(
  (val) => Number(val),
  z.number().positive(`${name} musbat son bo'lishi shart`)
);

// Common schemas
export const PatientSchema = z.object({
  firstName: requiredString('Ism'),
  lastName: requiredString('Familiya'),
  phone: phoneSchema,
  age: positiveNumber('Yosh'),
  source: z.enum(['walk-in', 'telegram', 'website', 'phone']).default('walk-in'),
  notes: z.string().optional(),
  allergies: z.string().optional(),
  bloodType: z.string().optional(),
});

export const BookingSchema = z.object({
  patientId: requiredString('Bemor'),
  doctorId: requiredString('Shifokor'),
  date: requiredString('Sana'),
  time: requiredString('Vaqt'),
  source: z.enum(['walk-in', 'telegram', 'website', 'phone']),
  status: z.enum(['pending', 'confirmed', 'arrived', 'no-show', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

export const ServiceSchema = z.object({
  name: requiredString('Xizmat nomi'),
  category: requiredString('Kategoriya'),
  price: positiveNumber('Narxi'),
  duration: positiveNumber('Davomiyligi'),
  description: z.string().optional(),
});

export const PaymentSchema = z.object({
  patientId: requiredString('Bemor'),
  amount: positiveNumber('Summa'),
  method: z.enum(['cash', 'card', 'transfer', 'insurance']),
  status: z.enum(['paid', 'partial', 'unpaid']),
  description: z.string().min(3, "Tavsif kamida 3 ta belgidan iborat bo'lishi kerak"),
});

export const DoctorSchema = z.object({
  name: requiredString('Ism familiya'),
  specialty: requiredString('Mutaxassislik'),
  phone: phoneSchema,
  workingHours: requiredString('Ish vaqti'),
});

export const VisitSchema = z.object({
  patientId: requiredString('Bemor'),
  status: z.enum(['not-started', 'in-progress', 'completed']),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof PatientSchema>;
export type PatientFormInput = z.input<typeof PatientSchema>;
export type BookingFormValues = z.infer<typeof BookingSchema>;
export type ServiceFormValues = z.infer<typeof ServiceSchema>;
export type ServiceFormInput = z.input<typeof ServiceSchema>;
export type PaymentFormValues = z.infer<typeof PaymentSchema>;
export type PaymentFormInput = z.input<typeof PaymentSchema>;
export type DoctorFormValues = z.infer<typeof DoctorSchema>;
export type VisitFormValues = z.infer<typeof VisitSchema>;
