import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { bookingsApi, doctorsApi, patientsApi, paymentsApi, visitsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Doctor, Patient, Visit } from '@/shared/types';
import PatientProfilePage from './PatientProfilePage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const patient = {
  id: 'p1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  age: 30,
  phone: '+998 90 111 22 33',
  address: '',
  workplace: 'IT',
  source: 'walk-in',
  notes: '',
  createdAt: '2026-06-01',
  toothChart: {},
} as Patient;

const doctor = { id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'T', phone: '' } as Doctor;
const visit = {
  id: 'v1', patientId: 'p1', doctorId: 'd1', date: '2026-06-10', status: 'completed', price: 400000, diagnosis: 'Karies', treatment: '', notes: '',
} as Visit;

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/patients/p1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/patients/:id" element={<PatientProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.mocked(patientsApi.get).mockResolvedValue(patient);
  vi.mocked(patientsApi.getComments).mockResolvedValue([]);
  vi.mocked(visitsApi.list).mockResolvedValue(paginated([visit]));
  vi.mocked(bookingsApi.list).mockResolvedValue(paginated([]));
  vi.mocked(paymentsApi.list).mockResolvedValue(paginated([]));
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated([doctor]));
});

describe('PatientProfilePage', () => {
  it("doctor / receptionist never see per-visit 'To'langan' / 'Qarz' boxes (payments are not loadable → they would show 100% debt)", async () => {
    for (const role of ['doctor', 'receptionist'] as const) {
      loginAs(role);
      const { unmount } = renderPage();
      await screen.findByText('Karies');
      expect(screen.queryByText("To'langan")).toBeNull();
      expect(screen.queryByText('Qarz')).toBeNull();
      unmount();
    }
  });

  it('admin with a balance sees the paid/debt figures', async () => {
    loginAs('admin');
    vi.mocked(patientsApi.get).mockResolvedValue({ ...patient, balance: -400000 });
    renderPage();
    await screen.findByText('Karies');
    await waitFor(() => expect(screen.getAllByText("To'langan").length).toBeGreaterThan(0));
    expect(screen.getAllByText('Qarz').length).toBeGreaterThan(0);
  });

  it('admin without the money fields (balance absent) does not show a fake 100% debt either', async () => {
    loginAs('admin');
    renderPage();
    await screen.findByText('Karies');
    expect(screen.queryByText("To'langan")).toBeNull();
  });

  it('"Yangi qabul" links to the booking form prefilled with this patient; phone is a tel: link; dates are formatted', async () => {
    loginAs('admin');
    renderPage();
    const link = await screen.findByRole('link', { name: /Yangi qabul/ });
    expect(link).toHaveAttribute('href', '/bookings?new=1&patientId=p1');
    expect(screen.getByRole('link', { name: '+998 90 111 22 33' })).toHaveAttribute('href', 'tel:+998901112233');
    expect(screen.queryByText('2026-06-10')).toBeNull();
    expect(screen.queryByText('2026-06-01')).toBeNull();
  });

  it('doctors cannot create bookings → no "Yangi qabul"', async () => {
    loginAs('doctor');
    renderPage();
    await screen.findByText('Karies');
    expect(screen.queryByRole('link', { name: /Yangi qabul/ })).toBeNull();
  });

  it('the comment input is cleared only after a successful save', async () => {
    loginAs('admin');
    vi.mocked(patientsApi.addComment).mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce({ id: 'c1' } as never);
    renderPage();
    await screen.findByText('Karies');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Xronika' }), { button: 0 });
    fireEvent.click(screen.getByRole('tab', { name: 'Xronika' }));
    const box = (await screen.findByPlaceholderText('Izoh qoldiring...')) as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'Muhim izoh' } });
    fireEvent.click(screen.getByRole('button', { name: /Yuborish/ }));
    await waitFor(() => expect(patientsApi.addComment).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /Yuborish/ })).toBeEnabled());
    expect(box.value).toBe('Muhim izoh'); // failed → text kept
    fireEvent.click(screen.getByRole('button', { name: /Yuborish/ }));
    await waitFor(() => expect(box.value).toBe(''));
  });

  it('payment dialog: warns (non-blocking) when the amount exceeds the linked visit debt, and opens fresh every time', async () => {
    loginAs('admin');
    vi.mocked(patientsApi.get).mockResolvedValue({ ...patient, balance: -400000 });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /To'lov qilish/ }));
    // prefilled with the remaining debt → no warning
    await screen.findByText('Tashrif qarzi tahlili');
    expect(screen.queryByText(/oshib ketdi/)).toBeNull();
    const amount = screen.getByPlaceholderText('50 000') as HTMLInputElement;
    fireEvent.change(amount, { target: { value: '500000' } });
    expect(await screen.findByText(/qolgan qarzidan .* oshib ketdi/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "To'lovni saqlash" })).toBeEnabled();
    // close, reopen through the generic "To'lov qayd etish" button → stale visit link/amount are gone
    fireEvent.keyDown(amount, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByRole('tab', { name: /To'lovlar/ }), { button: 0 });
    fireEvent.click(screen.getByRole('tab', { name: /To'lovlar/ }));
    fireEvent.click(await screen.findByRole('button', { name: /To'lov qayd etish/ }));
    await screen.findByText('Umumiy qarz tahlili');
    expect((screen.getByPlaceholderText('50 000') as HTMLInputElement).value).toBe('');
  });
});
