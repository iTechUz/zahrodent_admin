import { canAccessPayments, roleAccess, roleConfig } from './roles';

describe('canAccessPayments', () => {
  it('is true only for admin (backend ROLES_FINANCE = [admin])', () => {
    expect(canAccessPayments('admin')).toBe(true);
    expect(canAccessPayments('doctor')).toBe(false);
    expect(canAccessPayments('receptionist')).toBe(false);
    expect(canAccessPayments(undefined)).toBe(false);
    expect(canAccessPayments(null)).toBe(false);
  });
});

describe('roleAccess', () => {
  it('every role can reach the dashboard and settings', () => {
    for (const routes of Object.values(roleAccess)) {
      expect(routes).toContain('/');
      expect(routes).toContain('/settings');
    }
  });

  it('only admin reaches finance, analytics, doctors and users', () => {
    for (const path of ['/finance', '/analytics', '/doctors', '/users']) {
      expect(roleAccess.admin).toContain(path);
      expect(roleAccess.doctor).not.toContain(path);
      expect(roleAccess.receptionist).not.toContain(path);
    }
  });

  it('doctor is limited to dashboard, bookings, patients, settings', () => {
    expect([...roleAccess.doctor].sort()).toEqual(['/', '/bookings', '/patients', '/settings']);
  });

  it('receptionist gets services, notifications and leads (backend allows admin+receptionist)', () => {
    expect(roleAccess.receptionist).toEqual(
      expect.arrayContaining(['/bookings', '/patients', '/services', '/notifications', '/leads']),
    );
    expect(roleAccess.doctor).not.toContain('/leads');
    expect(roleAccess.doctor).not.toContain('/notifications');
  });
});

describe('roleConfig', () => {
  it('has an Uzbek label for every role', () => {
    expect(roleConfig.admin.label).toBe('Administrator');
    expect(roleConfig.doctor.label).toBe('Shifokor');
    expect(roleConfig.receptionist.label).toBe('Qabulxona');
    expect(Object.keys(roleConfig).sort()).toEqual(Object.keys(roleAccess).sort());
  });
});
