import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export const settingRoutes: RouteObject[] = [
  { path: 'settings', element: <SettingsPage /> },
];
