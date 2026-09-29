import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './useStore';
import { mockUsers } from '@/mock/users';
import { resetStore } from '@/test/resetStore';

describe('useStore (combined)', () => {
  beforeEach(resetStore);

  it('exposes every slice state key and action', () => {
    const s = useStore.getState();
    const expected = [
      'currentUser', 'isAuthenticated', 'login', 'logout',
      'patients', 'addPatient', 'updatePatient', 'deletePatient',
      'bookings', 'visits', 'addBooking', 'updateBooking', 'deleteBooking', 'addVisit', 'updateVisit', 'deleteVisit',
      'doctors', 'addDoctor', 'updateDoctor', 'deleteDoctor',
      'payments', 'addPayment', 'updatePayment', 'deletePayment',
      'services', 'notifications', 'addService', 'updateService', 'deleteService', 'addNotification',
      'darkMode', 'toggleDarkMode',
    ];
    expected.forEach((k) => expect(s).toHaveProperty(k));
  });

  it('notifies subscribers on change', () => {
    const calls: boolean[] = [];
    const unsub = useStore.subscribe((st) => calls.push(st.isAuthenticated));
    useStore.getState().login(mockUsers[0]);
    unsub();
    useStore.getState().logout();
    expect(calls).toEqual([true]);
  });

  it('resetStore restores initial state between tests', () => {
    useStore.getState().login(mockUsers[0]);
    useStore.getState().deletePatient('p1');
    resetStore();
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(useStore.getState().patients.some((p) => p.id === 'p1')).toBe(true);
  });
});
