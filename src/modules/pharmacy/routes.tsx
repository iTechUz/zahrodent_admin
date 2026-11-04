import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const PharmacyPage = lazy(() => import('./pages/PharmacyPage'));

export const pharmacyRoutes: RouteObject[] = [
  { path: 'pharmacy', element: <PharmacyPage /> },
];
