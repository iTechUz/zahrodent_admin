
export const DASHBOARD_MOCK_PATIENT_GROWTH = [
  { month: 'Yan', patients: 12 }, { month: 'Fev', patients: 19 }, { month: 'Mar', patients: 28 },
  { month: 'Apr', patients: 35 }, { month: 'May', patients: 42 }, { month: 'Iyn', patients: 55 },
];

export const DASHBOARD_MOCK_REVENUE_DATA = [
  { month: 'Yan', revenue: 2400000 }, { month: 'Fev', revenue: 3200000 }, { month: 'Mar', revenue: 4100000 },
  { month: 'Apr', revenue: 3800000 }, { month: 'May', revenue: 5200000 }, { month: 'Iyn', revenue: 6100000 },
];

export const DASHBOARD_MOCK_SOURCE_DATA = [
  { name: 'Shaxsan', value: 35, color: 'hsl(174, 62%, 38%)' },
  { name: 'Telegram', value: 30, color: 'hsl(210, 80%, 52%)' },
  { name: 'Veb-sayt', value: 20, color: 'hsl(38, 92%, 50%)' },
  { name: 'Telefon', value: 15, color: 'hsl(152, 60%, 40%)' },
];

export const DashboardService = {
  getPatientGrowth: () => DASHBOARD_MOCK_PATIENT_GROWTH,
  getRevenueData: () => DASHBOARD_MOCK_REVENUE_DATA,
  getSourceData: () => DASHBOARD_MOCK_SOURCE_DATA
};
