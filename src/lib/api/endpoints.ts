import type {
  Patient,
  Doctor,
  Booking,
  Visit,
  Payment,
  Service,
  Notification,
  NotificationRecipient,
  DoctorEfficiencyStats,
  PatientComment,
  Lead,
} from '@/shared/types';
import type { SessionUser } from '@/shared/types/auth';
import type {
  DashboardAnalytics,
  MonthlyAnalyticsRow,
  ServiceStats,
  SourceAnalyticsRow,
} from '@/shared/types';
import { apiRequest } from './client';
import { MAX_PAGE_LIMIT } from './helpers';

export { MAX_PAGE_LIMIT };

export async function loginRequest(body: { phone: string; password: string }) {
  return apiRequest<{ access_token: string; user: SessionUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (k === 'limit' && typeof v === 'number') {
      u.set(k, String(Math.min(Math.max(1, Math.floor(v)), MAX_PAGE_LIMIT)));
      return;
    }
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export type SortOrder = 'asc' | 'desc';

export type ListParams = {
  page?: number;
  /** 1..100 (clamped) */
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: SortOrder;
};

export const patientsApi = {
  list: (
    params?: ListParams & { source?: string; startDate?: string; endDate?: string; debtOnly?: string | boolean },
  ) => apiRequest<PaginatedResponse<Patient>>(`/patients${qs(params ?? {})}`),
  stats: () => apiRequest<{ total: number; newThisMonth: number; topSource: string }>('/patients/stats'),
  get: (id: string) => apiRequest<Patient>(`/patients/${id}`),
  create: (body: Partial<Patient> & Pick<Patient, 'firstName' | 'lastName' | 'age' | 'phone' | 'source'>) =>
    apiRequest<Patient>('/patients', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: PatientUpdatePayload) =>
    apiRequest<Patient>(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/patients/${id}`, { method: 'DELETE' }),
  getComments: (id: string) => apiRequest<PatientComment[]>(`/patients/${id}/comments`),
  addComment: (id: string, body: { content: string }) =>
    apiRequest<PatientComment>(`/patients/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
};

/** PATCH /patients/:id — `assignedDoctorId: null` unassigns the doctor */
export type PatientUpdatePayload = Omit<Partial<Patient>, 'assignedDoctorId'> & { assignedDoctorId?: string | null };

/** POST /doctors — to‘rt majburiy maydon + qolgan Doctor maydonlari ixtiyoriy */
export type DoctorCreatePayload = Pick<Doctor, 'firstName' | 'lastName' | 'specialty' | 'phone'> &
  Partial<Doctor> & { password?: string };

export type DoctorUpdatePayload = Partial<Doctor> & { password?: string };

export const doctorsApi = {
  list: (params?: ListParams & { specialty?: string }) =>
    apiRequest<PaginatedResponse<Doctor>>(`/doctors${qs(params ?? {})}`),
  stats: () => apiRequest<{ total: number; activeToday: number; totalVisits: number }>('/doctors/stats'),
  efficiency: () => apiRequest<DoctorEfficiencyStats[]>('/doctors/efficiency'),
  get: (id: string) => apiRequest<Doctor>(`/doctors/${id}`),
  create: (body: DoctorCreatePayload) =>
    apiRequest<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: DoctorUpdatePayload) =>
    apiRequest<Doctor>(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/doctors/${id}`, { method: 'DELETE' }),
};

export const bookingsApi = {
  list: (
    params?: ListParams & {
      status?: string;
      source?: string;
      patientId?: string;
      doctorId?: string;
      dateRange?: string;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    apiRequest<PaginatedResponse<Booking>>(`/bookings${qs(params ?? {})}`),
  stats: () => apiRequest<{ today: number; pending: number; completedToday: number }>('/bookings/stats'),
  get: (id: string) => apiRequest<Booking>(`/bookings/${id}`),
  create: (body: Omit<Booking, 'id' | 'createdAt'> & { createdAt?: string }) =>
    apiRequest<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Booking>) =>
    apiRequest<Booking>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/bookings/${id}`, { method: 'DELETE' }),
};

export const visitsApi = {
  list: (params?: ListParams & { patientId?: string; doctorId?: string }) =>
    apiRequest<PaginatedResponse<Visit>>(`/visits${qs(params ?? {})}`),
  get: (id: string) => apiRequest<Visit>(`/visits/${id}`),
  create: (body: Omit<Visit, 'id'>) =>
    apiRequest<Visit>('/visits', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Visit>) =>
    apiRequest<Visit>(`/visits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const servicesApi = {
  list: (params?: ListParams & { category?: string }) =>
    apiRequest<PaginatedResponse<Service>>(`/services${qs(params ?? {})}`),
  stats: () => apiRequest<ServiceStats>('/services/stats'),
  get: (id: string) => apiRequest<Service>(`/services/${id}`),
  create: (body: Omit<Service, 'id'>) =>
    apiRequest<Service>('/services', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Service>) =>
    apiRequest<Service>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/services/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  list: (
    params?: ListParams & {
      status?: string;
      patientId?: string;
      method?: string;
      type?: string;
      dateRange?: string;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    apiRequest<PaginatedResponse<Payment>>(`/payments${qs(params ?? {})}`),
  stats: () => apiRequest<{ totalRevenue: number; pendingAmount: number; todayRevenue: number }>('/payments/stats'),
  doctorStats: () => apiRequest<{ doctorId: string; total: number }[]>('/payments/doctor-stats'),
  get: (id: string) => apiRequest<Payment>(`/payments/${id}`),
  create: (body: Omit<Payment, 'id'> & { date?: string }) =>
    apiRequest<Payment>('/payments', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Payment>) =>
    apiRequest<Payment>(`/payments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/payments/${id}`, { method: 'DELETE' }),
};

export const analyticsApi = {
  /** Headline figures; `date` = clinic "today" (YYYY-MM-DD). Money fields are null for non-admins. */
  dashboard: (params?: { date?: string }) =>
    apiRequest<DashboardAnalytics>(`/analytics/dashboard${qs(params ?? {})}`),
  /** Oldest → newest month buckets. Money fields are null for non-admins. */
  monthly: (params?: { months?: number }) =>
    apiRequest<MonthlyAnalyticsRow[]>(`/analytics/monthly${qs(params ?? {})}`),
  sources: () => apiRequest<SourceAnalyticsRow[]>('/analytics/sources'),
};

export const notificationsApi = {
  list: (params?: ListParams) =>
    apiRequest<PaginatedResponse<Notification>>(`/notifications${qs(params ?? {})}`),
  create: (body: {
    patientId: string;
    type: Notification['type'];
    message: string;
    status?: Notification['status'];
    sentAt?: string;
  }) => apiRequest<Notification>('/notifications', { method: 'POST', body: JSON.stringify(body) }),
  sendReminders: () =>
    apiRequest<{ created: number }>('/notifications/send-reminders', { method: 'POST', body: '{}' }),
  getRecipients: (params: { startDate?: string; endDate?: string; targetType?: 'patient'|'doctor' }) =>
    apiRequest<NotificationRecipient[]>(`/notifications/recipients${qs(params)}`),
  bulkSend: (body: { targetIds: string[]; targetType: 'patient' | 'doctor'; message: string }) =>
    apiRequest<{ sent: number; failed: number; total: number }>('/notifications/bulk-send', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const usersApi = {
  list: () => apiRequest<SessionUser[]>('/users'),
  get: (id: string) => apiRequest<SessionUser>(`/users/${id}`),
  create: (body: {
    name: string;
    phone: string;
    password: string;
    role: 'admin' | 'doctor' | 'receptionist';
    specialty?: string;
    avatar?: string;
  }) => apiRequest<SessionUser>('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string,
    body: Partial<{
      name: string;
      phone: string;
      password: string;
      role: 'admin' | 'doctor' | 'receptionist';
      specialty?: string;
      avatar?: string;
    }>,
  ) =>
    apiRequest<SessionUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/users/${id}`, { method: 'DELETE' }),
};

export const leadsApi = {
  list: (params?: ListParams & { startDate?: string; endDate?: string; status?: string }) =>
    apiRequest<PaginatedResponse<Lead>>(`/leads${qs(params ?? {})}`),
  get: (id: string) => apiRequest<Lead>(`/leads/${id}`),
  create: (body: Partial<Lead>) =>
    apiRequest<Lead>('/leads', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Lead>) =>
    apiRequest<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: Lead['status']) =>
    apiRequest<Lead>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/leads/${id}`, { method: 'DELETE' }),
};
