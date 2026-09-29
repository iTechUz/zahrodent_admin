import {
  bookingsApi,
  doctorsApi,
  leadsApi,
  loginRequest,
  notificationsApi,
  patientsApi,
  paymentsApi,
  servicesApi,
  usersApi,
  visitsApi,
} from './endpoints';
import { apiRequest } from './client';

vi.mock('./client', () => ({ apiRequest: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);

beforeEach(() => {
  apiRequestMock.mockReset();
  apiRequestMock.mockResolvedValue({ ok: true });
});

/** The single call made to apiRequest, decoded for readable assertions. */
function lastCall() {
  expect(apiRequestMock).toHaveBeenCalledTimes(1);
  const [path, init = {}] = apiRequestMock.mock.calls[0];
  const { body, ...rest } = init as RequestInit & { skipAuth?: boolean };
  return {
    path,
    method: (init as RequestInit).method ?? 'GET',
    body: typeof body === 'string' ? JSON.parse(body) : body,
    rest,
  };
}

describe('loginRequest → POST /auth/login', () => {
  it('posts phone/password without auth and returns the response', async () => {
    apiRequestMock.mockResolvedValue({ access_token: 't', user: { id: '1' } });
    const res = await loginRequest({ phone: '+998901234567', password: 'secret' });
    const c = lastCall();
    expect(c.path).toBe('/auth/login');
    expect(c.method).toBe('POST');
    expect(c.body).toEqual({ phone: '+998901234567', password: 'secret' });
    expect(c.rest.skipAuth).toBe(true);
    expect(res).toEqual({ access_token: 't', user: { id: '1' } });
  });
});

describe('query-string building (qs)', () => {
  it('produces no "?" when params are empty or missing', async () => {
    await patientsApi.list();
    expect(lastCall().path).toBe('/patients');
    apiRequestMock.mockClear();
    await patientsApi.list({});
    expect(lastCall().path).toBe('/patients');
  });

  it('drops undefined and empty-string values but keeps 0', async () => {
    await patientsApi.list({ page: 0, limit: 10, search: '', source: undefined });
    expect(lastCall().path).toBe('/patients?page=0&limit=10');
  });

  it('URL-encodes values (spaces, +, cyrillic)', async () => {
    await patientsApi.list({ search: '+998 90', source: 'walk-in' });
    const url = new URL(`http://x${lastCall().path}`);
    expect(url.pathname).toBe('/patients');
    expect(url.searchParams.get('search')).toBe('+998 90');
    expect(url.searchParams.get('source')).toBe('walk-in');
    expect(lastCall().path).toContain('search=%2B998+90');
  });

  it('passes "all" filter values through (backend treats "all" as no filter)', async () => {
    await bookingsApi.list({ status: 'all', source: 'all', dateRange: 'month' });
    expect(lastCall().path).toBe('/bookings?status=all&source=all&dateRange=month');
  });
});

describe('patientsApi (backend: patients.controller.ts)', () => {
  it('list → GET /patients with pagination + filters', async () => {
    await patientsApi.list({ page: 2, limit: 10, search: 'Ali', source: 'telegram' });
    const c = lastCall();
    expect(c.method).toBe('GET');
    expect(c.path).toBe('/patients?page=2&limit=10&search=Ali&source=telegram');
  });

  it('stats → GET /patients/stats', async () => {
    await patientsApi.stats();
    expect(lastCall()).toMatchObject({ path: '/patients/stats', method: 'GET' });
  });

  it('get → GET /patients/:id', async () => {
    await patientsApi.get('p1');
    expect(lastCall()).toMatchObject({ path: '/patients/p1', method: 'GET' });
  });

  it('create → POST /patients with JSON body', async () => {
    const body = { firstName: 'Ali', lastName: 'V', age: 30, phone: '+998901112233', source: 'walk-in' as const };
    await patientsApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/patients', method: 'POST', body });
  });

  it('update → PATCH /patients/:id', async () => {
    await patientsApi.update('p1', { notes: 'x' });
    expect(lastCall()).toMatchObject({ path: '/patients/p1', method: 'PATCH', body: { notes: 'x' } });
  });

  it('remove → DELETE /patients/:id without body', async () => {
    await patientsApi.remove('p1');
    const c = lastCall();
    expect(c).toMatchObject({ path: '/patients/p1', method: 'DELETE' });
    expect(c.body).toBeUndefined();
  });

  it('getComments → GET /patients/:id/comments', async () => {
    await patientsApi.getComments('p1');
    expect(lastCall()).toMatchObject({ path: '/patients/p1/comments', method: 'GET' });
  });

  it('addComment → POST /patients/:id/comments { content }', async () => {
    await patientsApi.addComment('p1', { content: 'Salom' });
    expect(lastCall()).toMatchObject({ path: '/patients/p1/comments', method: 'POST', body: { content: 'Salom' } });
  });
});

describe('doctorsApi (backend: doctors.controller.ts)', () => {
  it('list → GET /doctors?specialty=', async () => {
    await doctorsApi.list({ page: 0, limit: 100, specialty: 'Terapevt' });
    expect(lastCall()).toMatchObject({ path: '/doctors?page=0&limit=100&specialty=Terapevt', method: 'GET' });
  });

  it('stats → GET /doctors/stats', async () => {
    await doctorsApi.stats();
    expect(lastCall().path).toBe('/doctors/stats');
  });

  it('efficiency → GET /doctors/efficiency', async () => {
    await doctorsApi.efficiency();
    expect(lastCall().path).toBe('/doctors/efficiency');
  });

  it('get → GET /doctors/:id', async () => {
    await doctorsApi.get('d1');
    expect(lastCall()).toMatchObject({ path: '/doctors/d1', method: 'GET' });
  });

  it('create → POST /doctors', async () => {
    const body = { firstName: 'A', lastName: 'B', specialty: 'Ortodont', phone: '+998901112233', password: 'secret1' };
    await doctorsApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/doctors', method: 'POST', body });
  });

  it('update → PATCH /doctors/:id', async () => {
    await doctorsApi.update('d1', { specialty: 'Xirurg' });
    expect(lastCall()).toMatchObject({ path: '/doctors/d1', method: 'PATCH', body: { specialty: 'Xirurg' } });
  });

  it('remove → DELETE /doctors/:id', async () => {
    await doctorsApi.remove('d1');
    expect(lastCall()).toMatchObject({ path: '/doctors/d1', method: 'DELETE' });
  });
});

describe('bookingsApi (backend: bookings.controller.ts)', () => {
  it('list → GET /bookings with status/source/patientId/dateRange', async () => {
    await bookingsApi.list({ page: 1, limit: 10, status: 'pending', source: 'phone', patientId: 'p1', dateRange: 'week' });
    expect(lastCall().path).toBe('/bookings?page=1&limit=10&status=pending&source=phone&patientId=p1&dateRange=week');
  });

  it('stats → GET /bookings/stats', async () => {
    await bookingsApi.stats();
    expect(lastCall().path).toBe('/bookings/stats');
  });

  it('get / create / update / remove', async () => {
    await bookingsApi.get('b1');
    expect(lastCall()).toMatchObject({ path: '/bookings/b1', method: 'GET' });
    apiRequestMock.mockClear();

    const body = {
      patientId: 'p1',
      doctorId: 'd1',
      date: '2026-06-10',
      time: '10:00',
      source: 'phone' as const,
      status: 'pending' as const,
    };
    await bookingsApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/bookings', method: 'POST', body });
    apiRequestMock.mockClear();

    await bookingsApi.update('b1', { status: 'arrived' });
    expect(lastCall()).toMatchObject({ path: '/bookings/b1', method: 'PATCH', body: { status: 'arrived' } });
    apiRequestMock.mockClear();

    await bookingsApi.remove('b1');
    expect(lastCall()).toMatchObject({ path: '/bookings/b1', method: 'DELETE' });
  });
});

describe('visitsApi (backend: visits.controller.ts — no DELETE route)', () => {
  it('list → GET /visits?patientId=&doctorId=', async () => {
    await visitsApi.list({ patientId: 'p1', doctorId: 'd1', limit: 100 });
    expect(lastCall().path).toBe('/visits?patientId=p1&doctorId=d1&limit=100');
  });

  it('get / create / update', async () => {
    await visitsApi.get('v1');
    expect(lastCall()).toMatchObject({ path: '/visits/v1', method: 'GET' });
    apiRequestMock.mockClear();

    const body = {
      patientId: 'p1',
      doctorId: 'd1',
      date: '2026-06-10',
      status: 'completed' as const,
      price: 100,
      diagnosis: '',
      treatment: '',
      notes: '',
    };
    await visitsApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/visits', method: 'POST', body });
    apiRequestMock.mockClear();

    await visitsApi.update('v1', { status: 'in-progress' });
    expect(lastCall()).toMatchObject({ path: '/visits/v1', method: 'PATCH', body: { status: 'in-progress' } });
  });

  it('does not expose remove (backend has no DELETE /visits/:id)', () => {
    expect(visitsApi).not.toHaveProperty('remove');
  });
});

describe('servicesApi (backend: services.controller.ts)', () => {
  it('list → GET /services?category=', async () => {
    await servicesApi.list({ page: 0, limit: 20, category: 'Davolash' });
    expect(lastCall().path).toBe('/services?page=0&limit=20&category=Davolash');
  });

  it('stats / get / create / update / remove', async () => {
    await servicesApi.stats();
    expect(lastCall().path).toBe('/services/stats');
    apiRequestMock.mockClear();

    await servicesApi.get('s1');
    expect(lastCall()).toMatchObject({ path: '/services/s1', method: 'GET' });
    apiRequestMock.mockClear();

    const body = { name: 'Plomba', category: 'Davolash', price: 300000, duration: 30 };
    await servicesApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/services', method: 'POST', body });
    apiRequestMock.mockClear();

    await servicesApi.update('s1', { price: 1 });
    expect(lastCall()).toMatchObject({ path: '/services/s1', method: 'PATCH', body: { price: 1 } });
    apiRequestMock.mockClear();

    await servicesApi.remove('s1');
    expect(lastCall()).toMatchObject({ path: '/services/s1', method: 'DELETE' });
  });
});

describe('paymentsApi (backend: payments.controller.ts, admin only)', () => {
  it('list → GET /payments with status/method/patientId/dateRange', async () => {
    await paymentsApi.list({ status: 'paid', method: 'cash', patientId: 'p1', dateRange: 'today', page: 0, limit: 10 });
    expect(lastCall().path).toBe('/payments?status=paid&method=cash&patientId=p1&dateRange=today&page=0&limit=10');
  });

  it('stats → /payments/stats, doctorStats → /payments/doctor-stats', async () => {
    await paymentsApi.stats();
    expect(lastCall().path).toBe('/payments/stats');
    apiRequestMock.mockClear();
    await paymentsApi.doctorStats();
    expect(lastCall().path).toBe('/payments/doctor-stats');
  });

  it('get / create / update / remove', async () => {
    await paymentsApi.get('pay1');
    expect(lastCall()).toMatchObject({ path: '/payments/pay1', method: 'GET' });
    apiRequestMock.mockClear();

    const body = {
      patientId: 'p1',
      amount: 100000,
      method: 'cash' as const,
      status: 'paid' as const,
      type: 'INCOME' as const,
      date: '2026-06-10',
      description: 'Plomba',
    };
    await paymentsApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/payments', method: 'POST', body });
    apiRequestMock.mockClear();

    await paymentsApi.update('pay1', { status: 'partial' });
    expect(lastCall()).toMatchObject({ path: '/payments/pay1', method: 'PATCH', body: { status: 'partial' } });
    apiRequestMock.mockClear();

    await paymentsApi.remove('pay1');
    expect(lastCall()).toMatchObject({ path: '/payments/pay1', method: 'DELETE' });
  });
});

describe('notificationsApi (backend: notifications.controller.ts)', () => {
  it('list → GET /notifications', async () => {
    await notificationsApi.list({ page: 0, limit: 10 });
    expect(lastCall().path).toBe('/notifications?page=0&limit=10');
  });

  it('create → POST /notifications', async () => {
    const body = { patientId: 'p1', type: 'sms' as const, message: 'Salom' };
    await notificationsApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/notifications', method: 'POST', body });
  });

  it('sendReminders → POST /notifications/send-reminders with {}', async () => {
    await notificationsApi.sendReminders();
    expect(lastCall()).toMatchObject({ path: '/notifications/send-reminders', method: 'POST', body: {} });
  });

  it('getRecipients → GET /notifications/recipients with ISO dates + targetType', async () => {
    await notificationsApi.getRecipients({
      startDate: '2026-06-10T00:00:00.000Z',
      endDate: '2026-06-10T23:59:59.999Z',
      targetType: 'patient',
    });
    const url = new URL(`http://x${lastCall().path}`);
    expect(url.pathname).toBe('/notifications/recipients');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      startDate: '2026-06-10T00:00:00.000Z',
      endDate: '2026-06-10T23:59:59.999Z',
      targetType: 'patient',
    });
  });

  it('getRecipients for doctors omits undefined dates', async () => {
    await notificationsApi.getRecipients({ startDate: undefined, endDate: undefined, targetType: 'doctor' });
    expect(lastCall().path).toBe('/notifications/recipients?targetType=doctor');
  });

  it('bulkSend → POST /notifications/bulk-send { targetIds, targetType, message }', async () => {
    const body = { targetIds: ['a', 'b'], targetType: 'patient' as const, message: 'Eslatma' };
    await notificationsApi.bulkSend(body);
    expect(lastCall()).toMatchObject({ path: '/notifications/bulk-send', method: 'POST', body });
  });
});

describe('usersApi (backend: users.controller.ts, admin only)', () => {
  it('list / get', async () => {
    await usersApi.list();
    expect(lastCall()).toMatchObject({ path: '/users', method: 'GET' });
    apiRequestMock.mockClear();
    await usersApi.get('u1');
    expect(lastCall()).toMatchObject({ path: '/users/u1', method: 'GET' });
  });

  it('create / update / remove', async () => {
    const body = { name: 'Ali', phone: '+998901112233', password: 'secret1', role: 'receptionist' as const };
    await usersApi.create(body);
    expect(lastCall()).toMatchObject({ path: '/users', method: 'POST', body });
    apiRequestMock.mockClear();

    await usersApi.update('u1', { name: 'Vali' });
    expect(lastCall()).toMatchObject({ path: '/users/u1', method: 'PATCH', body: { name: 'Vali' } });
    apiRequestMock.mockClear();

    await usersApi.remove('u1');
    expect(lastCall()).toMatchObject({ path: '/users/u1', method: 'DELETE' });
  });
});

describe('leadsApi (backend: leads.controller.ts)', () => {
  it('list → GET /leads with dates + status', async () => {
    await leadsApi.list({ page: 0, limit: 20, startDate: '2026-06-01', endDate: '2026-06-30', status: 'new' });
    expect(lastCall().path).toBe('/leads?page=0&limit=20&startDate=2026-06-01&endDate=2026-06-30&status=new');
  });

  it('get / create / update / remove', async () => {
    await leadsApi.get('l1');
    expect(lastCall()).toMatchObject({ path: '/leads/l1', method: 'GET' });
    apiRequestMock.mockClear();

    await leadsApi.create({ name: 'Ali', phone: '+998901112233' });
    expect(lastCall()).toMatchObject({ path: '/leads', method: 'POST', body: { name: 'Ali', phone: '+998901112233' } });
    apiRequestMock.mockClear();

    await leadsApi.update('l1', { notes: 'x' });
    expect(lastCall()).toMatchObject({ path: '/leads/l1', method: 'PATCH', body: { notes: 'x' } });
    apiRequestMock.mockClear();

    await leadsApi.remove('l1');
    expect(lastCall()).toMatchObject({ path: '/leads/l1', method: 'DELETE' });
  });

  it('updateStatus → PATCH /leads/:id/status { status }', async () => {
    await leadsApi.updateStatus('l1', 'converted');
    expect(lastCall()).toMatchObject({ path: '/leads/l1/status', method: 'PATCH', body: { status: 'converted' } });
  });
});
