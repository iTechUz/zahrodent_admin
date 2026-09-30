import type { UserRole } from '@/shared/types/auth';

/** Backend `ROLES_FINANCE` — to'lovlar API faqat admin */
export function canAccessPayments(role: UserRole | undefined | null): boolean {
  return role === 'admin';
}

const STAFF: UserRole[] = ['admin', 'doctor', 'receptionist'];
const FRONT_DESK: UserRole[] = ['admin', 'receptionist'];
const ADMIN: UserRole[] = ['admin'];
const DOCTOR_WRITE: UserRole[] = ['admin', 'doctor'];

/**
 * Action → roles allowed by the backend `@Roles(...)` guards (zahrodent_backend
 * src/<module>/<module>.controller.ts). UI buttons are hidden with `can()` so users
 * never hit a guaranteed 403. Keep in sync with the backend.
 */
export const permissions = {
  'patients.read': STAFF,
  'patients.create': FRONT_DESK,
  'patients.update': STAFF, // doctor: only own patients (backend scopes)
  'patients.delete': ADMIN, // soft delete (archive) — history is kept
  'patients.restore': ADMIN,
  'patients.comment': STAFF,
  'patients.stats': STAFF,

  'bookings.read': STAFF,
  'bookings.create': FRONT_DESK,
  'bookings.update': FRONT_DESK,
  'bookings.delete': FRONT_DESK,

  'visits.read': STAFF,
  'visits.create': DOCTOR_WRITE,
  'visits.update': DOCTOR_WRITE,

  'doctors.read': STAFF,
  'doctors.create': ADMIN,
  'doctors.update': ADMIN,
  'doctors.delete': ADMIN,
  'doctors.stats': ADMIN,
  'doctors.efficiency': ADMIN,

  'services.read': STAFF,
  'services.create': ADMIN,
  'services.update': ADMIN,
  'services.delete': ADMIN,
  'services.stats': FRONT_DESK,

  'payments.read': ADMIN,
  'payments.create': ADMIN,
  'payments.update': ADMIN,
  'payments.delete': ADMIN,

  'notifications.read': STAFF, // doctor: scoped to own
  'notifications.send': FRONT_DESK,

  'leads.read': FRONT_DESK,
  'leads.write': FRONT_DESK,

  'users.manage': ADMIN,

  'settings.read': STAFF,
  'settings.update': ADMIN,
  'auth.changePassword': STAFF,
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof permissions;

export function can(role: UserRole | undefined | null, action: Permission): boolean {
  return !!role && (permissions[action] as readonly UserRole[]).includes(role);
}

/** Rol bo'yicha marshrutga ruxsat (UI + ProtectedRoute) */
export const roleAccess: Record<UserRole, string[]> = {
  admin: [
    '/',
    '/bookings',
    '/patients',
    '/doctors',
    '/services',
    '/finance',
    '/analytics',
    '/notifications',
    '/leads',
    '/settings',
    '/users',
  ],
  doctor: ['/', '/bookings', '/patients', '/settings'],
  receptionist: ['/', '/bookings', '/patients', '/services', '/notifications', '/leads', '/settings'],
};

export const roleConfig: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-primary/15 text-primary border-primary/30' },
  doctor: { label: 'Shifokor', color: 'bg-info/15 text-info border-info/30' },
  receptionist: { label: 'Qabulxona', color: 'bg-warning/15 text-warning border-warning/30' },
};
