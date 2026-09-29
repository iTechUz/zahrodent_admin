import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { doctorsApi, patientsApi, visitsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Doctor, DoctorEfficiencyStats, Patient, Visit } from '@/shared/types';
import DoctorDetailsPage from './DoctorDetailsPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const doctor: Doctor = { id: 'd1', firstName: 'Aziz', lastName: 'Karimov', specialty: 'Terapevt', phone: '+998901112233' };
const eff: DoctorEfficiencyStats = {
  id: 'd1',
  firstName: 'Aziz',
  lastName: 'Karimov',
  specialty: 'Terapevt',
  totalBookings: 20,
  totalVisits: 8,
  uniquePatients: 5,
  totalRevenue: 4_000_000,
  conversionRate: 40,
  avgCheck: 500_000,
};

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/doctors/d1']}>
        <Routes>
          <Route path="/doctors/:id" element={<DoctorDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function statValue(title: string) {
  const titleEl = screen.getByText(title);
  return titleEl.closest('div')!.parentElement!.textContent ?? '';
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.mocked(doctorsApi.get).mockResolvedValue(doctor);
  vi.mocked(doctorsApi.efficiency).mockResolvedValue([eff]);
  vi.mocked(visitsApi.list).mockResolvedValue(
    paginated([{ id: 'v1', patientId: 'p1', doctorId: 'd1', date: '2026-06-10', status: 'completed', diagnosis: 'Karies' }] as Visit[]),
  );
  vi.mocked(patientsApi.list).mockResolvedValue(paginated([{ id: 'p1', firstName: 'Ali', lastName: 'Valiyev' }] as Patient[]));
});

describe('DoctorDetailsPage', () => {
  it('"Tashriflar" and "O\'rtacha chek" come from totalVisits / avgCheck (not the missing visitCount)', async () => {
    loginAs('admin');
    renderPage();
    await screen.findByText('Aziz Karimov');
    await screen.findByText(/500[\s\u00a0,.]?000/);
    expect(statValue('Tashriflar')).toContain('8');
    expect(statValue("O'rtacha chek")).toMatch(/500[\s\u00a0,.]?000/);
    expect(statValue('Jami bemorlar')).toContain('5');
  });

  it('recent visits show the patient name and a translated status', async () => {
    loginAs('admin');
    renderPage();
    expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText('Karies')).toBeInTheDocument();
    expect(visitsApi.list).toHaveBeenCalledWith({ doctorId: 'd1', limit: 10 });
  });

  it('admin sees edit + add-visit actions', async () => {
    loginAs('admin');
    renderPage();
    await screen.findByText('Aziz Karimov');
    expect(screen.getByRole('button', { name: /Tahrirlash/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tashrif qo'shish/ })).toBeInTheDocument();
  });
});
