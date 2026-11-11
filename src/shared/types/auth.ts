export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'pharmacist';

/** API login javabi — parolsiz sessiya foydalanuvchisi */
export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  specialty?: string;
  avatar?: string;
  doctorId?: string; // Doctor record id (doctor role only)
  /** false = deactivated (cannot log in); absent on older API versions = active */
  isActive?: boolean;
}
