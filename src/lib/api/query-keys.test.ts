import { queryKeys } from './query-keys';

describe('queryKeys', () => {
  it.each([
    ['patients', 'patient'],
    ['bookings', 'booking'],
    ['doctors', 'doctor'],
    ['visits', 'visit'],
    ['services', 'service'],
    ['payments', 'payment'],
  ] as const)('%s list key is a prefix of the %s detail key (so list invalidation hits details)', (list, detail) => {
    expect(queryKeys[list]).toEqual([list]);
    expect(queryKeys[detail]('42')).toEqual([list, '42']);
    expect(queryKeys[detail]('42').slice(0, 1)).toEqual(queryKeys[list]);
  });

  it.each(['patients', 'bookings', 'doctors', 'visits', 'services', 'payments'] as const)(
    '%s list/lookup keys include their params and share the entity prefix',
    (entity) => {
      const list = queryKeys[`${entity}List`];
      const lookup = queryKeys[`${entity}Lookup`];
      expect(list({ limit: 10 })).toEqual([entity, 'list', { limit: 10 }]);
      expect(list({ limit: 10 })).not.toEqual(list({ limit: 100 }));
      expect(lookup()).toEqual([entity, 'lookup', {}]);
      expect(lookup()).not.toEqual(list());
      expect(list().slice(0, 1)).toEqual(queryKeys[entity]);
      expect(lookup().slice(0, 1)).toEqual(queryKeys[entity]);
    },
  );

  it('stats keys live under the entity prefix', () => {
    expect(queryKeys.patientsStats).toEqual(['patients', 'stats']);
    expect(queryKeys.paymentsDoctorStats).toEqual(['payments', 'doctor-stats']);
    expect(queryKeys.doctorsEfficiency).toEqual(['doctors', 'efficiency']);
  });

  it('analytics keys include their params', () => {
    expect(queryKeys.analyticsDashboard('2026-06-17')).toEqual(['analytics', 'dashboard', '2026-06-17']);
    expect(queryKeys.analyticsMonthly(6)).toEqual(['analytics', 'monthly', 6]);
    expect(queryKeys.analyticsMonthly(6)).not.toEqual(queryKeys.analyticsMonthly(12));
  });

  it('notifications key', () => {
    expect(queryKeys.notifications).toEqual(['notifications']);
  });

  it('detail keys are distinct per id', () => {
    expect(queryKeys.patient('a')).not.toEqual(queryKeys.patient('b'));
  });

  it('has no key for leads/users — hooks use the literal ["leads"] / ["users"] keys', () => {
    expect(Object.keys(queryKeys)).not.toContain('leads');
    expect(Object.keys(queryKeys)).not.toContain('users');
  });
});
