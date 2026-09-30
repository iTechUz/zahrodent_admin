export type BookingSource = 'walk-in' | 'telegram' | 'website' | 'phone';
export type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'no-show' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'insurance';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type VisitStatus = 'not-started' | 'in-progress' | 'completed';
export type NotificationType = 'sms' | 'telegram';

export interface NotificationRecipient {
  id: string; // patient id
  firstName: string;
  lastName: string;
  phone: string;
  bookingId: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm
  patientName?: string; // used when targetType is doctor
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  address: string;
  workplace: string;
  /** GET /patients/:id returns it (string | null); list rows may omit it */
  assignedDoctorId?: string | null;
  assignedDoctor?: {
    firstName: string;
    lastName: string;
  };
  source: BookingSource;
  notes: string;
  avatar?: string;
  createdAt: string;
  toothChart?: Record<number, ToothRecord>;
  /** paid − owed (sum of payments − sum of visit prices); negative = debt */
  balance?: number;
  /** set when the patient is archived (soft-deleted) */
  deletedAt?: string | null;
}

/** Patient summary embedded in booking / payment rows — present even when the patient is archived. */
export interface PatientRef {
  firstName: string;
  lastName: string;
  deletedAt?: string | null;
}

export interface PatientComment {
  id: string;
  content: string;
  createdAt: string;
  patientId: string;
  authorId: string;
  author: {
    name: string;
    avatar?: string;
  };
}

export interface ToothRecord {
  toothNumber: number;
  condition: 'healthy' | 'cavity' | 'filled' | 'crown' | 'missing' | 'implant' | 'root-canal';
  notes?: string;
  date?: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone: string;
  /** login phone of the linked user account (if any) */
  loginPhone?: string;
  avatar?: string;
  schedule?: DoctorSchedule[];
  daysOff?: string[];
}

export interface DoctorSchedule {
  day: number; // 0=Du, 1=Se, ...6=Ya
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // minutes
  description?: string;
}

export interface Booking {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  source: BookingSource;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  serviceId?: string;
  patient?: PatientRef;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  bookingId?: string;
  date: string;
  status: VisitStatus;
  price: number;
  diagnosis: string;
  treatment: string;
  notes: string;
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  description: string;
  discount?: number;
  serviceId?: string;
  visitId?: string;
  patient?: PatientRef;
}

/** GET /settings — clinic info + reminder templates ({name},{date},{time},{doctor},{clinic}). */
export interface ClinicSettings {
  clinicName: string;
  address: string;
  phone: string;
  workingHours: string;
  smsReminderTemplate: string;
  telegramReminderTemplate: string;
  /** 0..7 — how many days before the booking the reminder goes out */
  reminderDaysAhead: number;
}

export interface Notification {
  id: string;
  patientId: string;
  doctorId?: string;
  type: NotificationType;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface DoctorEfficiencyStats {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  totalBookings: number;
  totalVisits: number;
  uniquePatients?: number;
  totalRevenue: number;
  conversionRate: number;
  avgCheck: number;
}

export interface ServiceStatsDetail {
  serviceId: string;
  revenue: number;
  patients: number;
}

export interface ServiceStats {
  totalCount: number;
  categoriesCount: number;
  avgPrice: number;
  detailed?: ServiceStatsDetail[];
}

/** GET /analytics/dashboard — money fields are null for non-admin roles */
export interface DashboardAnalytics {
  totalPatients: number;
  newPatientsThisMonth: number;
  todayBookings: number;
  todayCompleted: number;
  pendingBookings: number;
  activeDoctors: number;
  totalDoctors: number;
  todayRevenue: number | null;
  monthRevenue: number | null;
  monthExpenses: number | null;
  unpaidTotal: number | null;
  unpaidCount: number | null;
}

/** GET /analytics/monthly — one row per month (`YYYY-MM`), oldest first */
export interface MonthlyAnalyticsRow {
  month: string;
  newPatients: number;
  bookings: number;
  completedBookings: number;
  revenue: number | null;
  expenses: number | null;
}

/** GET /analytics/sources */
export interface SourceAnalyticsRow {
  source: string;
  count: number;
}

export type LeadStatus = 'new' | 'contacted' | 'consultation' | 'proposal' | 'converted' | 'cancelled';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  service?: string;
  message?: string;
  notes?: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}
