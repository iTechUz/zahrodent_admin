import { describe, expect, it } from 'vitest';
import { mockUsers, roleAccess, roleConfig, UserRole } from './users';

const roles: UserRole[] = ['admin', 'doctor', 'receptionist'];

describe('mock users & role access', () => {
  it('user ids and emails are unique', () => {
    expect(new Set(mockUsers.map((u) => u.id)).size).toBe(mockUsers.length);
    expect(new Set(mockUsers.map((u) => u.email)).size).toBe(mockUsers.length);
  });

  it('every role has at least one user, access list and config', () => {
    roles.forEach((r) => {
      expect(mockUsers.some((u) => u.role === r)).toBe(true);
      expect(roleAccess[r]).toContain('/');
      expect(roleConfig[r].label).toBeTruthy();
    });
  });

  it('admin can access every page any other role can', () => {
    roles.forEach((r) => roleAccess[r].forEach((p) => expect(roleAccess.admin).toContain(p)));
  });

  it('only admin sees finance and analytics', () => {
    expect(roleAccess.admin).toEqual(expect.arrayContaining(['/finance', '/analytics']));
    ['doctor', 'receptionist'].forEach((r) => {
      expect(roleAccess[r as UserRole]).not.toContain('/finance');
      expect(roleAccess[r as UserRole]).not.toContain('/analytics');
    });
  });

  it('receptionist cannot manage doctors, doctor can', () => {
    expect(roleAccess.receptionist).not.toContain('/doctors');
    expect(roleAccess.doctor).toContain('/doctors');
  });
});
