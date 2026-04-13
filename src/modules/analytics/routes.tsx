import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

export const analyticsRoutes: RouteObject[] = [
  { path: 'analytics', element: <AnalyticsPage /> },
];
