import { BookingSource, BookingStatus, PaymentStatus, VisitStatus } from '../types';

export const BOOKING_SOURCES: BookingSource[] = ['walk-in', 'telegram', 'website', 'phone'];

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  'walk-in': 'Shaxsan',
  telegram: 'Telegram',
  website: 'Veb-sayt',
  phone: 'Telefon',
};

export const BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'arrived', 'no-show', 'completed', 'cancelled'];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  arrived: 'Keldi',
  'no-show': 'Kelmadi',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "To'langan",
  partial: 'Qisman',
  unpaid: "To'lanmagan",
};

export const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'partial', 'unpaid'];

export const PAYMENT_METHOD_LABELS = {
  cash: 'Naqd',
  card: 'Karta',
  transfer: "O'tkazma",
  insurance: 'Sug\'urta',
};

export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'insurance'];

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  'not-started': 'Boshlanmagan',
  'in-progress': 'Jarayonda',
  completed: 'Yakunlangan',
};

export const VISIT_STATUSES: VisitStatus[] = ['not-started', 'in-progress', 'completed'];
