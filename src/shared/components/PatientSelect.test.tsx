import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { patientsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, paginated } from '@/test/utils';
import type { Patient } from '@/shared/types';
import { PatientSelect } from './PatientSelect';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const p = (id: string, firstName: string) => ({ id, firstName, lastName: 'Valiyev', phone: '+998901112233' }) as Patient;

function renderSelect(props: Partial<React.ComponentProps<typeof PatientSelect>> = {}) {
  const onValueChange = vi.fn();
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <PatientSelect value="" onValueChange={onValueChange} {...props} />
    </QueryClientProvider>,
  );
  return { onValueChange };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
});

describe('PatientSelect', () => {
  it('loads nothing until opened, then asks the server for the first 20 patients', async () => {
    vi.mocked(patientsApi.list).mockResolvedValue(paginated([p('p1', 'Ali')]));
    const { onValueChange } = renderSelect();
    expect(patientsApi.list).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('combobox'));
    await waitFor(() => expect(patientsApi.list).toHaveBeenCalledWith({ search: '', limit: 20 }));
    fireEvent.click(await screen.findByText('Ali Valiyev (+998901112233)'));
    expect(onValueChange).toHaveBeenCalledWith('p1');
  });

  it('searches server-side (debounced), never filtering a downloaded table', async () => {
    vi.mocked(patientsApi.list).mockResolvedValue(paginated([p('p1', 'Ali')]));
    renderSelect();
    fireEvent.click(screen.getByRole('combobox'));
    await screen.findByText('Ali Valiyev (+998901112233)');
    fireEvent.change(screen.getByPlaceholderText('Ism yoki telefon...'), { target: { value: 'Bob' } });
    await waitFor(() => expect(patientsApi.list).toHaveBeenCalledWith({ search: 'Bob', limit: 20 }));
  });

  it('shows the known selected patient without any request (editing a booking)', () => {
    renderSelect({ value: 'p9', selected: { id: 'p9', firstName: 'Olim', lastName: 'Karimov', deletedAt: '2026-01-01' } });
    expect(screen.getByRole('combobox')).toHaveTextContent("Olim Karimov (o'chirilgan)");
    expect(patientsApi.list).not.toHaveBeenCalled();
    expect(patientsApi.get).not.toHaveBeenCalled();
  });

  it('fetches just the selected patient when it is unknown to the caller', async () => {
    vi.mocked(patientsApi.get).mockResolvedValue(p('p7', 'Sardor'));
    renderSelect({ value: 'p7' });
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Sardor Valiyev'));
    expect(patientsApi.get).toHaveBeenCalledWith('p7');
    expect(patientsApi.list).not.toHaveBeenCalled();
  });
});
