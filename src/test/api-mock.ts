/**
 * Shared vi.fn() stand-ins for `@/lib/api/endpoints`, used by hook tests:
 *
 *   vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
 *
 * Call `resetApiMock()` in beforeEach to restore the default "empty" responses.
 */
const page = () => Promise.resolve({ data: [] as never[], total: 0 });

function make() {
  return {
    loginRequest: vi.fn(),
    patientsApi: {
      list: vi.fn(page),
      stats: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getComments: vi.fn(),
      addComment: vi.fn(),
    },
    doctorsApi: {
      list: vi.fn(page),
      stats: vi.fn(),
      efficiency: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    bookingsApi: {
      list: vi.fn(page),
      stats: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    visitsApi: {
      list: vi.fn(page),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    servicesApi: {
      list: vi.fn(page),
      stats: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    paymentsApi: {
      list: vi.fn(page),
      stats: vi.fn(),
      doctorStats: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    notificationsApi: {
      list: vi.fn(page),
      create: vi.fn(),
      sendReminders: vi.fn(),
      getRecipients: vi.fn(),
      bulkSend: vi.fn(),
    },
    usersApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    analyticsApi: {
      dashboard: vi.fn(),
      monthly: vi.fn(() => Promise.resolve([])),
      sources: vi.fn(() => Promise.resolve([])),
    },
    leadsApi: {
      list: vi.fn(page),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      remove: vi.fn(),
    },
  };
}

export const apiMock = make();

/** Endpoints whose real response is an array. */
const ARRAY_ENDPOINTS = new Set(['analyticsApi.monthly', 'analyticsApi.sources', 'usersApi.list', 'doctorsApi.efficiency', 'paymentsApi.doctorStats', 'notificationsApi.getRecipients', 'patientsApi.getComments']);

/** Reset every mock: paginated lists → empty page, array endpoints → [], everything else → resolves {}. */
export function resetApiMock() {
  apiMock.loginRequest.mockReset();
  for (const [group, fns] of Object.entries(apiMock)) {
    if (typeof fns === 'function') continue;
    for (const [name, fn] of Object.entries(fns as Record<string, ReturnType<typeof vi.fn>>)) {
      fn.mockReset();
      if (ARRAY_ENDPOINTS.has(`${group}.${name}`)) fn.mockImplementation(() => Promise.resolve([]));
      else if (name === 'list') fn.mockImplementation(page);
      else fn.mockImplementation(() => Promise.resolve({}));
    }
  }
}

export const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};
