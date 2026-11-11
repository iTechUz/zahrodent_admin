import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { prescriptionsApi } from '@/lib/api/endpoints';
import { createTestQueryClient, loginAs } from '@/test/utils';
import PharmacyPage from './PharmacyPage';

vi.mock('@/lib/api/endpoints', () => ({
  prescriptionsApi: { pharmacySearch: vi.fn(), dispense: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  loginAs('pharmacist');
});

describe('PharmacyPage', () => {
  it('shows an in-flight indicator while searching, then the empty state', async () => {
    let resolve!: (v: never[]) => void;
    vi.mocked(prescriptionsApi.pharmacySearch).mockReturnValue(new Promise((r) => (resolve = r)) as never);
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <PharmacyPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByPlaceholderText(/Retsept kodi/), { target: { value: 'K7M2X9QD' } });
    fireEvent.click(screen.getByRole('button', { name: /Qidirish/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Qidirilmoqda');
    expect(screen.queryByText('Faol retsept topilmadi')).not.toBeInTheDocument();
    resolve([]);
    await waitFor(() => expect(screen.getByText('Faol retsept topilmadi')).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
