import { Booking } from '@/shared/types';
import { BOOKING_SOURCE_LABELS } from '@/shared/constants';

// Mock data (future: fetch from API)
export const MONTHLY_PATIENTS = [
  { month: 'Yan', count: 12 }, { month: 'Fev', count: 19 }, { month: 'Mar', count: 28 },
  { month: 'Apr', count: 35 }, { month: 'May', count: 42 }, { month: 'Iyn', count: 55 },
];

export const REVENUE_GROWTH = [
  { month: 'Yan', revenue: 2.4 }, { month: 'Fev', revenue: 3.2 }, { month: 'Mar', revenue: 4.1 },
  { month: 'Apr', revenue: 3.8 }, { month: 'May', revenue: 5.2 }, { month: 'Iyn', revenue: 6.1 },
];

export const CONVERSION_DATA = [
  { month: 'Yan', booked: 20, completed: 15 }, { month: 'Fev', booked: 28, completed: 22 },
  { month: 'Mar', booked: 35, completed: 30 }, { month: 'Apr', booked: 40, completed: 33 },
  { month: 'May', booked: 48, completed: 40 }, { month: 'Iyn', booked: 55, completed: 48 },
];

export const AnalyticsService = {
  getMonthlyPatients: () => MONTHLY_PATIENTS,
  getRevenueGrowth: () => REVENUE_GROWTH,
  getConversionData: () => CONVERSION_DATA,
  
  processSourceData: (bookings: Booking[]) => {
    const sourceCount = bookings.reduce((acc, b) => { 
      acc[b.source] = (acc[b.source] || 0) + 1; 
      return acc; 
    }, {} as Record<string, number>);

    return Object.entries(sourceCount).map(([name, value]) => ({ 
      name: BOOKING_SOURCE_LABELS[name as keyof typeof BOOKING_SOURCE_LABELS] || name, 
      value 
    }));
  },

  getChartColors: () => [
    'hsl(174, 62%, 38%)', 
    'hsl(210, 80%, 52%)', 
    'hsl(38, 92%, 50%)', 
    'hsl(152, 60%, 40%)'
  ]
};
