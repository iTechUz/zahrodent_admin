import { z } from 'zod';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  REMINDER_DAYS_MAX,
  TEMPLATE_MAX_LENGTH,
} from '@/lib/api/endpoints';

/** Settings page form schemas (limits mirror the backend UpdateSettingsDto / ChangePasswordDto). */

export const clinicInfoSchema = z.object({
  clinicName: z.string().trim().min(1, 'Klinika nomini kiriting').max(100, "Klinika nomi 100 ta belgidan oshmasin"),
  address: z.string().trim().max(300, "Manzil 300 ta belgidan oshmasin"),
  phone: z.string().trim().max(50, "Telefon 50 ta belgidan oshmasin"),
  workingHours: z.string().trim().max(200, "Ish vaqti 200 ta belgidan oshmasin"),
});

export type ClinicInfoValues = z.infer<typeof clinicInfoSchema>;

const templateField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} matnini kiriting`)
    .max(TEMPLATE_MAX_LENGTH, `${label} ${TEMPLATE_MAX_LENGTH} ta belgidan oshmasin`);

export const reminderSchema = z.object({
  smsReminderTemplate: templateField('SMS shablon'),
  telegramReminderTemplate: templateField('Telegram shablon'),
  reminderDaysAhead: z.coerce
    .number({ invalid_type_error: 'Kun sonini kiriting' })
    .int('Butun son kiriting')
    .min(0, "0 dan kichik bo'lmasin")
    .max(REMINDER_DAYS_MAX, `${REMINDER_DAYS_MAX} kundan oshmasin`),
});

export type ReminderValues = z.infer<typeof reminderSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Joriy parolni kiriting'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Yangi parol kamida ${PASSWORD_MIN_LENGTH} ta belgidan iborat bo'lishi kerak`)
      .max(PASSWORD_MAX_LENGTH, `Yangi parol ${PASSWORD_MAX_LENGTH} ta belgidan oshmasligi kerak`),
    confirmPassword: z.string().min(1, 'Yangi parolni takrorlang'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Parollar mos kelmadi',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Yangi parol joriy paroldan farq qilishi kerak',
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
