import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { servicesApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import ServicesPage from './ServicesPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

beforeEach(() => {
  resetApiMock();
  loginAs('admin');
  vi.mocked(servicesApi.list).mockResolvedValue(
    paginated([{ id: 's1', name: 'Plomba', category: 'Davolash', price: 300_000, duration: 30 }]),
  );
  vi.mocked(servicesApi.stats).mockResolvedValue({ totalCount: 1, categoriesCount: 1, avgPrice: 300_000 });
});

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ServicesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ServicesPage sorting + search', () => {
  it('clicking a header sorts on the server by the whitelisted field', async () => {
    renderPage();
    await screen.findByText('Plomba');
    fireEvent.click(screen.getByRole('button', { name: 'Narxi' }));
    await waitFor(() =>
      expect(servicesApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'price', order: 'asc', page: 0 })),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Narxi' }));
    await waitFor(() => expect(servicesApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ order: 'desc' })));
    expect(screen.getByRole('columnheader', { name: 'Narxi' })).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(screen.getByRole('button', { name: 'Kategoriya' }));
    await waitFor(() =>
      expect(servicesApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'category', order: 'asc' })),
    );
  });

  it('search input is debounced (one request after typing stops)', async () => {
    renderPage();
    await screen.findByText('Plomba');
    const before = vi.mocked(servicesApi.list).mock.calls.length;
    const input = screen.getByPlaceholderText('Xizmat qidirish...');
    fireEvent.change(input, { target: { value: 'P' } });
    fireEvent.change(input, { target: { value: 'Pl' } });
    fireEvent.change(input, { target: { value: 'Plo' } });
    expect(input).toHaveValue('Plo');
    expect(vi.mocked(servicesApi.list).mock.calls.length).toBe(before);
    await waitFor(() => expect(servicesApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Plo' })));
    const searches = vi.mocked(servicesApi.list).mock.calls.slice(before).map(([p]) => p?.search);
    expect(searches).toEqual(['Plo']);
  });
});
