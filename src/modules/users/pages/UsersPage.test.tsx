import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { usersApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, makeUser } from '@/test/utils';
import { UsersPageContent } from './UsersPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <UsersPageContent />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('admin', { id: 'me' });
  vi.mocked(usersApi.list).mockResolvedValue([
    makeUser('admin', { id: 'me', name: 'Men Admin' }),
    makeUser('receptionist', { id: 'u2', name: 'Qabul Xodim' }),
    makeUser('pharmacist', { id: 'u3', name: 'Apteka Xodim', isActive: false }),
  ]);
});

describe('UsersPage', () => {
  it('mentions the pharmacist role in the description', async () => {
    renderPage();
    expect(await screen.findByText(/apteka xodimlarini/)).toBeInTheDocument();
  });

  it('never offers delete / deactivate on the logged-in user, but does for others', async () => {
    renderPage();
    await screen.findByText('Men Admin');
    const myCard = screen.getByText('Men Admin').closest('.group') as HTMLElement;
    expect(within(myCard).queryByRole('button', { name: "O'chirish" })).not.toBeInTheDocument();
    expect(within(myCard).queryByRole('button', { name: 'Nofaol qilish' })).not.toBeInTheDocument();
    expect(within(myCard).getByRole('button', { name: 'Tahrirlash' })).toBeInTheDocument();
    const other = screen.getByText('Qabul Xodim').closest('.group') as HTMLElement;
    expect(within(other).getByRole('button', { name: "O'chirish" })).toBeInTheDocument();
    expect(within(other).getByRole('button', { name: 'Nofaol qilish' })).toBeInTheDocument();
  });

  it('shows a Nofaol badge and offers reactivation for inactive users', async () => {
    renderPage();
    const card = (await screen.findByText('Apteka Xodim')).closest('.group') as HTMLElement;
    expect(within(card).getByText('Nofaol')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Faollashtirish' })).toBeInTheDocument();
  });

  it('deactivating asks for confirmation first, then PATCHes isActive:false', async () => {
    vi.mocked(usersApi.update).mockResolvedValue(makeUser('receptionist'));
    renderPage();
    const card = (await screen.findByText('Qabul Xodim')).closest('.group') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Nofaol qilish' }));
    expect(usersApi.update).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Nofaol qilish' }));
    await waitFor(() => expect(usersApi.update).toHaveBeenCalledWith('u2', { isActive: false }));
  });
});
