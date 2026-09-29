import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store/useStore';
import { mockNotifications, mockServices } from '@/mock/data';
import { Notification, Service } from '@/shared/types';
import { describeCrudSlice } from '@/test/crudSliceCases';
import { resetStore } from '@/test/resetStore';

describeCrudSlice<Service>({
  name: 'serviceSlice',
  listKey: 'services',
  initial: mockServices,
  add: (s, sv) => s.addService(sv),
  update: (s, id, sv) => s.updateService(id, sv),
  remove: (s, id) => s.deleteService(id),
  makeNew: () => ({ id: 's-new', name: 'Yangi', category: 'Davolash', price: 1000, duration: 10 }),
  patch: { price: 777, description: 'x' },
});

describe('serviceSlice notifications', () => {
  beforeEach(resetStore);

  it('initial notifications are the mock data', () => {
    expect(useStore.getState().notifications).toEqual(mockNotifications);
  });

  it('addNotification prepends (newest first)', () => {
    const n: Notification = {
      id: 'n-new',
      patientId: 'p1',
      type: 'sms',
      message: 'Salom',
      sentAt: '2024-04-01T10:00:00',
      status: 'sent',
    };
    const before = useStore.getState().notifications;
    useStore.getState().addNotification(n);
    const after = useStore.getState().notifications;
    expect(after[0]).toBe(n);
    expect(after).toHaveLength(before.length + 1);
    expect(after.slice(1)).toEqual(before);
    expect(before).toHaveLength(mockNotifications.length);
  });

  it('service CRUD does not affect notifications', () => {
    useStore.getState().deleteService('s1');
    expect(useStore.getState().notifications).toBe(mockNotifications);
  });
});
