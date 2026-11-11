import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { notificationsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs } from '@/test/utils';
import type { UserRole } from '@/shared/types/auth';
import { Topbar } from './Topbar';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

function renderTopbar(role: UserRole) {
  loginAs(role);
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Topbar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
});

describe('Topbar', () => {
  it('has no fake "unread" counter on the bell and does not poll notifications', () => {
    vi.mocked(notificationsApi.list).mockResolvedValue({ data: [{ id: 'n1', status: 'sent' }], total: 1 } as never);
    renderTopbar('admin');
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(notificationsApi.list).not.toHaveBeenCalled();
  });

  it('hides the search box for a pharmacist (nothing searchable) but keeps it for staff', () => {
    const { unmount } = renderTopbar('pharmacist');
    expect(screen.queryByText('Qidirish...')).not.toBeInTheDocument();
    unmount();
    renderTopbar('receptionist');
    expect(screen.getByText('Qidirish...')).toBeInTheDocument();
  });
});
