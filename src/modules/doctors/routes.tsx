import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const DoctorsPage = lazy(() => import('./pages/DoctorsPage'));

export const doctorRoutes: RouteObject[] = [
  { path: 'doctors', element: <DoctorsPage /> },
];
