import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const FinancePage = lazy(() => import('./pages/FinancePage'));

export const financeRoutes: RouteObject[] = [
  { path: 'finance', element: <FinancePage /> },
];
