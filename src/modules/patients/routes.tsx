import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const PatientsPage = lazy(() => import('./pages/PatientsPage'));
const PatientProfilePage = lazy(() => import('./pages/PatientProfilePage'));

export const patientRoutes: RouteObject[] = [
  { path: 'patients', element: <PatientsPage /> },
  { path: 'patients/:id', element: <PatientProfilePage /> },
];
