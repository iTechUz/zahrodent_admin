import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, Doctor, Patient } from '@/shared/types';
import { GlobalSearch } from './GlobalSearch';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

function renderSearch() {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  });
  return screen.getByPlaceholderText('Bemor, shifokor yoki qabul qidirish...') as HTMLInputElement;
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('admin');
  vi.mocked(patientsApi.list).mockResolvedValue(
    paginated([{ id: 'p1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901112233' }] as Patient[], 57),
  );
  vi.mocked(doctorsApi.list).mockResolvedValue(
    paginated([{ id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'Terapevt', phone: '' }] as Doctor[]),
  );
  vi.mocked(bookingsApi.list).mockResolvedValue(
    paginated([{ id: 'b1', patientId: 'p9', doctorId: 'd1', date: '2026-06-17', time: '10:00' }] as Booking[]),
  );
  vi.mocked(patientsApi.get).mockResolvedValue({ id: 'p9', firstName: 'Sardor', lastName: 'Aliyev' } as Patient);
});

describe('GlobalSearch', () => {
  it('does not fetch anything until the user types', async () => {
    renderSearch();
    await new Promise((r) => setTimeout(r, 300));
    expect(patientsApi.list).not.toHaveBeenCalled();
    expect(doctorsApi.list).not.toHaveBeenCalled();
    expect(bookingsApi.list).not.toHaveBeenCalled();
  });

  it('queries the backend with `search` (debounced) instead of filtering a cached first page', async () => {
    const input = renderSearch();
    fireEvent.change(input, { target: { value: 'Al' } });
    fireEvent.change(input, { target: { value: 'Ali' } });
    await waitFor(() => expect(patientsApi.list).toHaveBeenCalled());
    // debounced: only the final term reaches the API
    expect(patientsApi.list).toHaveBeenCalledTimes(1);
    expect(patientsApi.list).toHaveBeenCalledWith({ search: 'Ali', limit: 4 });
    expect(doctorsApi.list).toHaveBeenCalledWith({ search: 'Ali', limit: 3 });
    expect(bookingsApi.list).toHaveBeenCalledWith({ search: 'Ali', limit: 3 });
  });

  it('doctor results use firstName + lastName (Doctor has no `name`) and link to the doctor page', async () => {
    const input = renderSearch();
    fireEvent.change(input, { target: { value: 'Aziz' } });
    const doctorRow = await screen.findByText('Aziz Karimov');
    expect(screen.getByText('Terapevt')).toBeInTheDocument();
    fireEvent.click(doctorRow);
    expect(navigate).toHaveBeenCalledWith('/doctors/d1');
  });

  it('patients link to their profile', async () => {
    const input = renderSearch();
    fireEvent.change(input, { target: { value: 'Ali' } });
    fireEvent.click(await screen.findByText('Ali Valiyev'));
    expect(navigate).toHaveBeenCalledWith('/patients/p1');
  });

  it('booking rows resolve the patient name via GET /patients/:id', async () => {
    const input = renderSearch();
    fireEvent.change(input, { target: { value: 'Ali' } });
    expect(await screen.findByText('Sardor Aliyev')).toBeInTheDocument();
    expect(patientsApi.get).toHaveBeenCalledWith('p9');
  });

  it('roles without access to /doctors get no doctor results', async () => {
    loginAs('doctor');
    const input = renderSearch();
    fireEvent.change(input, { target: { value: 'Ali' } });
    await waitFor(() => expect(patientsApi.list).toHaveBeenCalled());
    expect(doctorsApi.list).not.toHaveBeenCalled();
  });
});
