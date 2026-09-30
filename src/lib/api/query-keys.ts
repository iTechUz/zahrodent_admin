/**
 * React Query keys.
 *
 * Rule: a key must contain every parameter that changes the response. Two queries
 * with the same key but different `limit`/filters share one cache entry, so
 * whichever mounted first wins (the old bare `['patients']` bug).
 *
 * - `queryKeys.<entity>` (e.g. `['patients']`) is only a prefix for invalidation.
 * - `<entity>List(params)` → one paginated page with these params.
 * - `<entity>Lookup(params)` → every page (fetchAllPages) for selects / lookups.
 */
type Params = Record<string, unknown>;

const listKey = <E extends string>(entity: E) => (params: Params = {}) => [entity, 'list', params] as const;
const lookupKey = <E extends string>(entity: E) => (params: Params = {}) => [entity, 'lookup', params] as const;

export const queryKeys = {
  patients: ['patients'] as const,
  patient: (id: string) => ['patients', id] as const,
  patientsList: listKey('patients'),
  patientsLookup: lookupKey('patients'),
  patientsStats: ['patients', 'stats'] as const,

  bookings: ['bookings'] as const,
  booking: (id: string) => ['bookings', id] as const,
  bookingsList: listKey('bookings'),
  bookingsLookup: lookupKey('bookings'),
  bookingsStats: ['bookings', 'stats'] as const,

  doctors: ['doctors'] as const,
  doctor: (id: string) => ['doctors', id] as const,
  doctorsList: listKey('doctors'),
  doctorsLookup: lookupKey('doctors'),
  doctorsStats: ['doctors', 'stats'] as const,
  doctorsEfficiency: ['doctors', 'efficiency'] as const,

  visits: ['visits'] as const,
  visit: (id: string) => ['visits', id] as const,
  visitsList: listKey('visits'),
  visitsLookup: lookupKey('visits'),

  services: ['services'] as const,
  service: (id: string) => ['services', id] as const,
  servicesList: listKey('services'),
  servicesLookup: lookupKey('services'),
  servicesStats: ['services', 'stats'] as const,

  payments: ['payments'] as const,
  payment: (id: string) => ['payments', id] as const,
  paymentsList: listKey('payments'),
  paymentsLookup: lookupKey('payments'),
  paymentsStats: ['payments', 'stats'] as const,
  paymentsDoctorStats: ['payments', 'doctor-stats'] as const,

  notifications: ['notifications'] as const,
  notificationsList: listKey('notifications'),

  settings: ['settings'] as const,

  analytics: ['analytics'] as const,
  analyticsDashboard: (date: string) => ['analytics', 'dashboard', date] as const,
  analyticsMonthly: (months: number) => ['analytics', 'monthly', months] as const,
  analyticsSources: ['analytics', 'sources'] as const,
};
