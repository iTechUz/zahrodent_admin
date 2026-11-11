import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { analyticsApi, bookingsApi, doctorsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createTestQueryClient, loginAs, paginated } from '@/test/utils';
import type { Booking, DashboardAnalytics } from '@/shared/types';
import DashboardPage from './DashboardPage';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));
// recharts needs layout; the charts are irrelevant here
vi.mock('recharts', () => {
  const Dummy = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    AreaChart: Dummy, Area: Dummy, XAxis: Dummy, YAxis: Dummy, CartesianGrid: Dummy, Tooltip: Dummy,
    ResponsiveContainer: Dummy, PieChart: Dummy, Pie: Dummy, Cell: Dummy, BarChart: Dummy, Bar: Dummy,
  };
});

const dashboard = {
  totalPatients: 10, newPatientsThisMonth: 1, todayBookings: 2, todayCompleted: 1, pendingBookings: 1,
  activeDoctors: 1, totalDoctors: 1, todayRevenue: 1_500_000, monthRevenue: 48_000_000, monthExpenses: 1,
  unpaidTotal: 3_200_000, unpaidCount: 4,
} as DashboardAnalytics;

function Where() {
  const l = useLocation();
  return <div data-testid="where">{l.pathname + l.search}</div>;
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.mocked(analyticsApi.dashboard).mockResolvedValue(dashboard);
  vi.mocked(analyticsApi.monthly).mockResolvedValue([]);
  vi.mocked(analyticsApi.daily).mockResolvedValue([]);
  vi.mocked(analyticsApi.sources).mockResolvedValue([]);
  vi.mocked(doctorsApi.list).mockResolvedValue(paginated([{ id: 'd1', firstName: 'Aziz', lastName: 'K', specialty: 'T', phone: '' }] as never));
  vi.mocked(bookingsApi.list).mockResolvedValue(
    paginated([
      { id: 'b7', patientId: 'p1', patient: { firstName: 'Ali', lastName: 'Valiyev' }, doctorId: 'd1', date: '2026-06-17', time: '10:00', status: 'pending', source: 'phone' },
    ] as Booking[]),
  );
});

describe('DashboardPage', () => {
  it('"So\'nggi qabullar" rows open that booking (deep link), also from the keyboard', async () => {
    loginAs('admin');
    renderPage();
    const row = await screen.findByRole('link', { name: /Qabulni ochish: Ali Valiyev/ });
    fireEvent.keyDown(row, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/bookings?booking=b7'));
  });

  it('quick action "Yangi qabul" opens the booking form', async () => {
    loginAs('admin');
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Yangi qabul' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/bookings?new=1'));
  });

  it('money cards are hidden for roles without payment access (receptionist)', async () => {
    loginAs('receptionist');
    renderPage();
    await screen.findByText('Jami bemorlar');
    expect(screen.queryByText(/48[\s\u00a0,.]?000[\s\u00a0,.]?000/)).toBeNull();
    expect(screen.queryByText(/3[\s\u00a0,.]?200[\s\u00a0,.]?000/)).toBeNull();
    expect(screen.getByText(/Faqat admin ko'radi/)).toBeInTheDocument();
  });

  it('admin sees the money cards', async () => {
    loginAs('admin');
    renderPage();
    expect(await screen.findByText(/48[\s\u00a0,.]?000[\s\u00a0,.]?000/)).toBeInTheDocument();
  });
});
