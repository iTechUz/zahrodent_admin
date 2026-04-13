import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const ServicesPage = lazy(() => import('./pages/ServicesPage'));

export const serviceRoutes: RouteObject[] = [
  { path: 'services', element: <ServicesPage /> },
];
