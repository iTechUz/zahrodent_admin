import { can, canAccessPayments, permissions, roleAccess, roleConfig } from './roles';

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

describe('can() — mirrors backend @Roles guards', () => {
  it.each([
    // [action, admin, doctor, receptionist]
    ['patients.create', true, false, true],
    ['patients.update', true, true, true],
    ['patients.delete', true, false, true],
    ['bookings.create', true, false, true],
    ['bookings.update', true, false, true],
    ['bookings.delete', true, false, true],
    ['visits.create', true, true, false],
    ['visits.update', true, true, false],
    ['doctors.read', true, true, true],
    ['doctors.create', true, false, false],
    ['doctors.update', true, false, false],
    ['doctors.delete', true, false, false],
    ['doctors.stats', true, false, false],
    ['doctors.efficiency', true, false, false],
    ['services.read', true, true, true],
    ['services.create', true, false, false],
    ['services.update', true, false, false],
    ['services.delete', true, false, false],
    ['services.stats', true, false, true],
    ['payments.read', true, false, false],
    ['payments.create', true, false, false],
    ['notifications.read', true, true, true],
    ['notifications.send', true, false, true],
    ['leads.read', true, false, true],
    ['users.manage', true, false, false],
  ] as const)('%s → admin:%s doctor:%s receptionist:%s', (action, admin, doctor, receptionist) => {
    expect(can('admin', action)).toBe(admin);
    expect(can('doctor', action)).toBe(doctor);
    expect(can('receptionist', action)).toBe(receptionist);
  });

  it('no role → nothing is allowed', () => {
    for (const action of Object.keys(permissions) as (keyof typeof permissions)[]) {
      expect(can(undefined, action)).toBe(false);
      expect(can(null, action)).toBe(false);
    }
  });

  it('payments permission agrees with canAccessPayments', () => {
    for (const role of ['admin', 'doctor', 'receptionist'] as const) {
      expect(can(role, 'payments.read')).toBe(canAccessPayments(role));
    }
  });
});
