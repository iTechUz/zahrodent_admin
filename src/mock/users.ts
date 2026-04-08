export type UserRole = 'admin' | 'doctor' | 'receptionist';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  specialty?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: 'u1',
    name: 'Dr. Zahro Admin',
    email: 'admin@zahro.dental',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'u2',
    name: 'Dr. Kamila Usmanova',
    email: 'kamila@zahro.dental',
    password: 'doctor123',
    role: 'doctor',
    specialty: 'Umumiy stomatologiya',
  },
  {
    id: 'u3',
    name: 'Dr. Farrukh Ismoilov',
    email: 'farrukh@zahro.dental',
    password: 'doctor123',
    role: 'doctor',
    specialty: 'Ortodontiya',
  },
  {
    id: 'u4',
    name: 'Gulnora Qabulxona',
    email: 'gulnora@zahro.dental',
    password: 'reception123',
    role: 'receptionist',
  },
  {
    id: 'u5',
    name: 'Madina Qabulxona',
    email: 'madina@zahro.dental',
    password: 'reception123',
    role: 'receptionist',
  },
];

// Rol bo'yicha sahifaga ruxsat
export const roleAccess: Record<UserRole, string[]> = {
  admin: ['/', '/bookings', '/patients', '/doctors', '/services', '/finance', '/analytics', '/notifications', '/settings'],
  doctor: ['/', '/bookings', '/patients', '/doctors', '/services', '/notifications', '/settings'],
  receptionist: ['/', '/bookings', '/patients', '/services', '/notifications', '/settings'],
};

// Rol nomlari va ranglari
export const roleConfig: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-primary/15 text-primary border-primary/30' },
  doctor: { label: 'Shifokor', color: 'bg-info/15 text-info border-info/30' },
  receptionist: { label: 'Qabulxona', color: 'bg-warning/15 text-warning border-warning/30' },
};
