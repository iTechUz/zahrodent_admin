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
