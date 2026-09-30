import { SORT_FIELDS, isSortField, sortBy } from './sort-fields';

describe('SORT_FIELDS (backend *_SORT_FIELDS mirror)', () => {
  it('matches the backend whitelists', () => {
    expect(SORT_FIELDS).toEqual({
      patients: ['createdAt', 'firstName', 'lastName', 'age', 'source'],
      bookings: ['date', 'time', 'createdAt', 'status', 'source'],
      visits: ['date', 'status', 'price'],
      payments: ['date', 'amount', 'status', 'method', 'type'],
      services: ['name', 'category', 'price', 'duration'],
      leads: ['createdAt', 'updatedAt', 'name', 'status', 'source'],
      doctors: ['firstName', 'lastName', 'specialty'],
      users: ['createdAt', 'name', 'role', 'phone'],
    });
  });

  it('sortBy returns the field unchanged (compile-time checked)', () => {
    expect(sortBy('payments', 'amount')).toBe('amount');
  });

  it('isSortField', () => {
    expect(isSortField('patients', 'age')).toBe(true);
    expect(isSortField('patients', 'balance')).toBe(false);
    expect(isSortField('users', undefined)).toBe(false);
  });
});
