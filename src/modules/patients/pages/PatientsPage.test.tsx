import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { createQueryClient } from '@/lib/api/query-client';
import { resetApiMock } from '@/test/api-mock';
import { loginAs, paginated } from '@/test/utils';
import type { Patient } from '@/shared/types';
import PatientsPage from './PatientsPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));
const exportToExcel = vi.fn();
vi.mock('@/shared/lib/excel', () => ({ exportToExcel: (...a: unknown[]) => exportToExcel(...a) }));

const row = {
  id: 'p1', firstName: 'Ali', lastName: 'Valiyev', age: 30, phone: '+998 90 111 22 33', address: '', workplace: 'IT',
  source: 'walk-in', notes: '', createdAt: '2026-06-01', balance: -150000,
} as Patient;

function renderPage(url = '/patients') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PatientsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  loginAs('admin');
  vi.mocked(patientsApi.list).mockResolvedValue(paginated([row]));
  vi.mocked(patientsApi.stats).mockResolvedValue({ total: 1, newThisMonth: 0, topSource: '—' });
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated([]));
});

describe('PatientsPage', () => {
  it('patient name is a real link and the phone dials (tel:)', async () => {
    renderPage();
    expect(await screen.findByRole('link', { name: 'Ali Valiyev' })).toHaveAttribute('href', '/patients/p1');
    expect(screen.getByRole('link', { name: '+998 90 111 22 33' })).toHaveAttribute('href', 'tel:+998901112233');
  });

  it("export button is in Uzbek and the exported dates are formatted, not raw ISO", async () => {
    renderPage();
    await screen.findByRole('link', { name: 'Ali Valiyev' });
    expect(screen.queryByText('Excel Export')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: "Excel'ga yuklash" }));
    await waitFor(() => expect(exportToExcel).toHaveBeenCalled());
    const rows = exportToExcel.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows[0]["Ro'yxatdan o'tgan sana"]).toBe('01/06/2026');
  });

  it('archiving a patient with debt (409) asks for confirmation and retries with ?force=true', async () => {
    vi.mocked(patientsApi.remove).mockRejectedValueOnce(new ApiError(409, 'qarz')).mockResolvedValueOnce({ id: 'p1' });
    renderPage();
    await screen.findByRole('link', { name: 'Ali Valiyev' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Amallar' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Arxivlash/ }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Arxivlash' }));
    const dialog = await screen.findByText(/Bemorning qarzi .* so'm\. Baribir arxivlaysizmi\?/);
    expect(dialog).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Baribir arxivlash' }));
    await waitFor(() => expect(patientsApi.remove).toHaveBeenLastCalledWith('p1', { force: true }));
  });

  it('?new=1 opens the create dialog', async () => {
    renderPage('/patients?new=1');
    expect(await screen.findByText("Yangi bemor qo'shish", { selector: 'h2' })).toBeInTheDocument();
  });
});
