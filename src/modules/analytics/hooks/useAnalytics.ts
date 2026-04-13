import { useStore } from '@/store/useStore';
import { AnalyticsService } from '../services/analytics.service';

export const useAnalytics = () => {
  const bookings = useStore((state) => state.bookings);

  const sourceData = AnalyticsService.processSourceData(bookings);
  const colors = AnalyticsService.getChartColors();

  return {
    monthlyPatients: AnalyticsService.getMonthlyPatients(),
    revenueGrowth: AnalyticsService.getRevenueGrowth(),
    conversionData: AnalyticsService.getConversionData(),
    sourceData,
    colors,
  };
};
