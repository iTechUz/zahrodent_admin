import { render, screen } from '@testing-library/react';
import AnalyticsPage from './AnalyticsPage';
import { useAnalytics } from '../hooks/useAnalytics';

vi.mock('../hooks/useAnalytics', () => ({ useAnalytics: vi.fn() }));
vi.mock('../components/Charts', () => {
  const Dummy = () => <div />;
  return { GrowthChart: Dummy, RevenueChart: Dummy, ConversionChart: Dummy, SourcePieChart: Dummy, DoctorEfficiencyChart: Dummy, ServiceRevenueHBarChart: Dummy };
});

const base = {
  range: {}, setRange: vi.fn(), colors: [], canViewPayments: true, serviceStats: [], monthlyPatients: [],
  revenueGrowth: [], conversionData: [], sourceData: [], doctorEfficiency: [], isError: false, error: null, refetch: vi.fn(),
};

describe('AnalyticsPage loading state', () => {
  it('shows a skeleton (not "no data" empty states) while loading', () => {
    vi.mocked(useAnalytics).mockReturnValue({ ...base, isLoading: true } as never);
    render(<AnalyticsPage />);
    expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument();
    expect(screen.queryByText("Tanlangan davr uchun ma'lumotlar mavjud emas")).toBeNull();
  });

  it('shows the charts / empty states once loaded', () => {
    vi.mocked(useAnalytics).mockReturnValue({ ...base, isLoading: false } as never);
    render(<AnalyticsPage />);
    expect(screen.queryByTestId('analytics-skeleton')).toBeNull();
    expect(screen.getAllByText("Tanlangan davr uchun ma'lumotlar mavjud emas").length).toBeGreaterThan(0);
  });
});
