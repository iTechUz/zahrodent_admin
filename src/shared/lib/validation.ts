import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\+998\d{9}$/, "Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
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
  // backend CreatePatientDto: MinLength(3)
  address: requiredString('Manzil').min(3, "Manzil kamida 3 ta belgidan iborat bo'lishi kerak"),
  workplace: requiredString('Ish joyi'),
  assignedDoctorId: z.string().optional(),
  source: z.enum(['walk-in', 'telegram', 'website', 'phone']).default('walk-in'),
  notes: z.string().optional(),
});

export const BookingSchema = z.object({
  patientId: requiredString('Bemor'),
  doctorId: requiredString('Shifokor'),
  serviceId: z.string().optional().or(z.literal('')),
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
  type: z.enum(['INCOME', 'EXPENSE']).default('INCOME'),
  description: z.string().min(3, "Tavsif kamida 3 ta belgidan iborat bo'lishi kerak"),
});

export const doctorScheduleSlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isWorking: z.boolean(),
});

export const DoctorSchema = z
  .object({
    firstName: requiredString('Ism'),
    lastName: requiredString('Familiya'),
    specialty: requiredString('Mutaxassislik'),
    phone: phoneSchema,
    password: z.string().min(6, "Kamida 6 ta belgi").optional().or(z.literal('')),
    /** Haftalik jadval (7 kun) — kartadagi katakchalar bilan mos */
    schedule: z.array(doctorScheduleSlotSchema).length(7),
    /** Vergul bilan ajratilgan sanalar, masalan: 2026-01-01, 2026-02-14 */
    daysOffText: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    data.schedule.forEach((slot, index) => {
      if (slot.isWorking && (!slot.startTime?.trim() || !slot.endTime?.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ish kunlari uchun boshlanish va tugash vaqtini kiriting',
          path: ['schedule', index, 'startTime'],
        });
      }
    });
  });

export const VisitSchema = z.object({
  patientId: requiredString('Bemor'),
  status: z.enum(['not-started', 'in-progress', 'completed']),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export const PatientCommentSchema = z.object({
  content: requiredString('Izoh'),
  patientId: requiredString('Bemor'),
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
