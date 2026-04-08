export type BookingSource = 'walk-in' | 'telegram' | 'website' | 'phone';
export type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'no-show' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'insurance';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type VisitStatus = 'not-started' | 'in-progress' | 'completed';
export type NotificationType = 'sms' | 'telegram';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  source: BookingSource;
  notes: string;
  avatar?: string;
  createdAt: string;
  allergies?: string;
  bloodType?: string;
  toothChart?: Record<number, ToothRecord>;
}

export interface ToothRecord {
  toothNumber: number;
  condition: 'healthy' | 'cavity' | 'filled' | 'crown' | 'missing' | 'implant' | 'root-canal';
  notes?: string;
  date?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  workingHours: string;
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
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  bookingId?: string;
  date: string;
  status: VisitStatus;
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
  date: string;
  description: string;
  discount?: number;
  serviceId?: string;
}

export interface Notification {
  id: string;
  patientId: string;
  type: NotificationType;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
}
